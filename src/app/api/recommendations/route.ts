/**
 * Recommendation Engine API
 *
 * Generates personalized product recommendations based on customer quiz results
 *
 * Flow:
 * 1. Get customer concerns from quiz
 * 2. Find boosters that address those concerns (sorted by effectiveness)
 * 3. Find base products that pair with those boosters
 * 4. Create bundle offers (6-month, 3-month, 1-month, single)
 * 5. Apply pricing/discounts based on budget
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Discount tiers for bundles
const BUNDLE_DISCOUNTS = {
  '6_month': 40,
  '3_month': 30,
  '1_month': 20,
  'starter': 15,
  'single': 0
}

// Budget ranges (monthly)
const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  '0-50': { min: 0, max: 50 },
  '50-100': { min: 50, max: 100 },
  '100-200': { min: 100, max: 200 },
  '200+': { min: 200, max: 999999 }
}

interface RecommendedBooster {
  id: string
  title: string
  thumbnail?: string
  price: number
  concerns: string[]
  totalScore: number
  isPrimary: boolean
}

interface RecommendedProduct {
  id: string
  title: string
  thumbnail?: string
  price: number
  category: string
  boosters: RecommendedBooster[]
}

// POST - Generate recommendations for a customer profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId } = body

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    }

    // 1. Get customer profile with concerns
    const { data: profile, error: profileError } = await supabase
      .from('customer_profiles')
      .select(`
        *,
        customer_concerns(
          concern_id,
          severity,
          is_priority,
          category,
          product_attribute_options(id, name, handle, product_categories(handle))
        )
      `)
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const customerConcerns = profile.customer_concerns || []
    const concernIds = customerConcerns.map((c: any) => c.concern_id)

    if (concernIds.length === 0) {
      return NextResponse.json({
        error: 'No concerns selected',
        recommendations: []
      })
    }

    // 2. Get the skin_concerns attribute ID
    const { data: attribute } = await supabase
      .from('product_attributes')
      .select('id')
      .eq('handle', 'skin_concerns')
      .single()

    // 3. Find boosters that address customer concerns (using product_attribute_values)
    const { data: boosterMappings } = await supabase
      .from('product_attribute_values')
      .select(`
        product_id,
        option_id,
        products(
          id, title, thumbnail, status,
          metadata,
          product_category_mapping(product_categories(handle))
        )
      `)
      .eq('attribute_id', attribute?.id)
      .in('option_id', concernIds)

    // Score and rank boosters
    const boosterScores = new Map<string, {
      booster: any
      totalScore: number
      concerns: string[]
      isPrimary: boolean
    }>()

    for (const mapping of boosterMappings || []) {
      const booster = mapping.products
      if (!booster || booster.status !== 'published') continue

      const existingScore = boosterScores.get(booster.id)
      const customerConcern = customerConcerns.find((c: any) => c.concern_id === mapping.option_id)

      // Score = base (3) × severity × priority multiplier
      const severityMultiplier = customerConcern?.severity || 3
      const priorityMultiplier = customerConcern?.is_priority ? 2 : 1
      const score = 3 * severityMultiplier * priorityMultiplier

      if (existingScore) {
        existingScore.totalScore += score
        existingScore.concerns.push(mapping.option_id)
      } else {
        boosterScores.set(booster.id, {
          booster,
          totalScore: score,
          concerns: [mapping.option_id],
          isPrimary: false
        })
      }
    }

    // Sort boosters by score
    const rankedBoosters = Array.from(boosterScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10) // Top 10 boosters

    // 3. Get base products that pair with these boosters
    const boosterIds = rankedBoosters.map(b => b.booster.id)

    const { data: addonMatches } = await supabase
      .from('product_addon_matches')
      .select(`
        product_id,
        addon_product_id,
        display_order,
        products!product_addon_matches_product_id_fkey(
          id, title, thumbnail, status, metadata,
          product_category_mapping(product_categories(handle))
        )
      `)
      .in('addon_product_id', boosterIds)
      .order('display_order', { ascending: true })

    // Group by base product
    const baseProducts = new Map<string, {
      product: any
      boosters: typeof rankedBoosters
      totalScore: number
    }>()

    for (const match of addonMatches || []) {
      const product = match.products
      if (!product || product.status !== 'published') continue

      const boosterData = rankedBoosters.find(b => b.booster.id === match.addon_product_id)
      if (!boosterData) continue

      const existing = baseProducts.get(product.id)
      if (existing) {
        existing.boosters.push(boosterData)
        existing.totalScore += boosterData.totalScore
      } else {
        baseProducts.set(product.id, {
          product,
          boosters: [boosterData],
          totalScore: boosterData.totalScore
        })
      }
    }

    // 4. Build recommendation bundles
    const budget = BUDGET_RANGES[profile.monthly_budget] || BUDGET_RANGES['100-200']

    // Get concern names for display
    const concernNames: Record<string, string> = {}
    customerConcerns.forEach((c: any) => {
      concernNames[c.concern_id] = c.product_attribute_options?.name || 'Unknown'
    })

    // Format boosters for response
    const formatBooster = (b: typeof rankedBoosters[0]): RecommendedBooster => ({
      id: b.booster.id,
      title: b.booster.title,
      thumbnail: b.booster.thumbnail,
      price: b.booster.metadata?.price || 0,
      concerns: b.concerns.map(cid => concernNames[cid] || cid),
      totalScore: b.totalScore,
      isPrimary: b.isPrimary
    })

    // Create different bundle options
    const recommendations = {
      profile: {
        id: profile.id,
        skin_type: profile.skin_type,
        age_group: profile.age_group,
        concerns: customerConcerns.map((c: any) => ({
          name: c.product_attribute_options?.name,
          category: c.category || c.product_attribute_options?.product_categories?.handle,
          severity: c.severity,
          isPriority: c.is_priority
        }))
      },

      // Top recommended boosters
      topBoosters: rankedBoosters.slice(0, 5).map(formatBooster),

      // Full routine bundle (all categories)
      fullRoutine: {
        type: '6_month',
        title: '6-Month Complete Routine',
        description: 'Your personalized skincare system for best results',
        discount: BUNDLE_DISCOUNTS['6_month'],
        products: Array.from(baseProducts.values())
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 6)
          .map(p => ({
            id: p.product.id,
            title: p.product.title,
            thumbnail: p.product.thumbnail,
            price: p.product.metadata?.price || 0,
            category: p.product.product_category_mapping?.[0]?.product_categories?.handle || 'face',
            boosters: p.boosters.map(formatBooster)
          })),
        originalPrice: 0, // Calculate below
        finalPrice: 0
      },

      // 3-month starter
      starterBundle: {
        type: '3_month',
        title: '3-Month Starter Kit',
        description: 'Begin your skincare journey',
        discount: BUNDLE_DISCOUNTS['3_month'],
        products: [] as any[],
        originalPrice: 0,
        finalPrice: 0
      },

      // 1-month trial
      trialBundle: {
        type: '1_month',
        title: '1-Month Trial',
        description: 'Try before you commit',
        discount: BUNDLE_DISCOUNTS['1_month'],
        products: [] as any[],
        originalPrice: 0,
        finalPrice: 0
      },

      // Single top product
      singleProduct: {
        type: 'single',
        title: 'Start with One',
        description: 'Our top pick for your concerns',
        discount: 0,
        products: [] as any[],
        originalPrice: 0,
        finalPrice: 0
      },

      // Guarantees and incentives
      incentives: {
        freeShipping: true,
        freeShippingThreshold: 100,
        moneyBackGuarantee: 90,
        bonusSamples: true
      }
    }

    // Calculate prices (rounded to 2 decimal places)
    const calcBundlePrice = (products: any[], discount: number) => {
      const original = products.reduce((sum, p) => {
        const productPrice = p.price || 0
        const boosterPrices = (p.boosters || []).reduce((s: number, b: any) => s + (b.price || 0), 0)
        return sum + productPrice + boosterPrices
      }, 0)
      const final = Math.round(original * (1 - discount / 100) * 100) / 100
      return { original: Math.round(original * 100) / 100, final }
    }

    // Full routine pricing
    const fullPrices = calcBundlePrice(recommendations.fullRoutine.products, BUNDLE_DISCOUNTS['6_month'])
    recommendations.fullRoutine.originalPrice = fullPrices.original * 6
    recommendations.fullRoutine.finalPrice = fullPrices.final * 6

    // Starter bundle (top 3 products)
    recommendations.starterBundle.products = recommendations.fullRoutine.products.slice(0, 3)
    const starterPrices = calcBundlePrice(recommendations.starterBundle.products, BUNDLE_DISCOUNTS['3_month'])
    recommendations.starterBundle.originalPrice = starterPrices.original * 3
    recommendations.starterBundle.finalPrice = starterPrices.final * 3

    // Trial bundle (top 2 products)
    recommendations.trialBundle.products = recommendations.fullRoutine.products.slice(0, 2)
    const trialPrices = calcBundlePrice(recommendations.trialBundle.products, BUNDLE_DISCOUNTS['1_month'])
    recommendations.trialBundle.originalPrice = trialPrices.original
    recommendations.trialBundle.finalPrice = trialPrices.final

    // Single product (top 1)
    if (recommendations.fullRoutine.products.length > 0) {
      recommendations.singleProduct.products = [recommendations.fullRoutine.products[0]]
      const singlePrices = calcBundlePrice(recommendations.singleProduct.products, 0)
      recommendations.singleProduct.originalPrice = singlePrices.original
      recommendations.singleProduct.finalPrice = singlePrices.final
    }

    // Save recommendation to database
    const { data: savedRec } = await supabase
      .from('customer_recommendations')
      .insert({
        profile_id: profileId,
        recommendation_type: 'full_routine',
        title: recommendations.fullRoutine.title,
        description: recommendations.fullRoutine.description,
        original_price: recommendations.fullRoutine.originalPrice,
        discount_percent: recommendations.fullRoutine.discount,
        final_price: recommendations.fullRoutine.finalPrice,
        duration_months: 6,
        products: recommendations.fullRoutine.products,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single()

    // Update profile
    await supabase
      .from('customer_profiles')
      .update({
        recommendation_generated: true,
        recommendation_generated_at: new Date().toISOString()
      })
      .eq('id', profileId)

    return NextResponse.json({
      recommendations,
      recommendationId: savedRec?.id
    })

  } catch (error: any) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get existing recommendations for a profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    }

    const { data: recommendations, error } = await supabase
      .from('customer_recommendations')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ recommendations: recommendations || [] })

  } catch (error: any) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
