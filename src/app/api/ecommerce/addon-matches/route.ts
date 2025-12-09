/**
 * Product Add-on Matches API
 * GET - Get matched addon IDs for a product (with AI suggestions based on shared concerns)
 * PUT - Save addon matches for a product
 * POST - Auto-generate matches using AI based on shared skin concerns
 *
 * Uses product_addon_matches table with columns: product_id, addon_product_id
 * Matching Logic: Boosters that share skin concerns with the product are suggested
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get matched addons for a product (with AI suggestions)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const includeSuggestions = searchParams.get('suggestions') === 'true'

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    // Get existing matches from product_addon_matches table
    const { data: matches, error } = await supabase
      .from('product_addon_matches')
      .select('addon_product_id, display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching matches:', error)
      return NextResponse.json({ addonIds: [], suggestions: [] })
    }

    const addonIds = matches?.map(m => m.addon_product_id) || []

    // If suggestions requested, find boosters that share concerns with this product
    let suggestions: any[] = []
    if (includeSuggestions) {
      // Get skin_concerns attribute ID
      const { data: attribute } = await supabase
        .from('product_attributes')
        .select('id')
        .eq('handle', 'skin_concerns')
        .single()

      // Get product's assigned skin concerns
      const { data: productConcerns } = await supabase
        .from('product_attribute_values')
        .select('option_id')
        .eq('product_id', productId)
        .eq('attribute_id', attribute?.id)

      const productConcernIds = productConcerns?.map(c => c.option_id) || []

      if (productConcernIds.length > 0) {
        // Get concern names for display
        const { data: concernOptions } = await supabase
          .from('product_attribute_options')
          .select('id, name')
          .in('id', productConcernIds)

        const concernNameMap: Record<string, string> = {}
        concernOptions?.forEach(c => { concernNameMap[c.id] = c.name })

        // Find boosters that share these concerns
        const { data: sharedBoosters } = await supabase
          .from('product_attribute_values')
          .select(`
            product_id,
            option_id,
            products(
              id, title, thumbnail, status,
              metadata,
              product_types(is_addon)
            )
          `)
          .eq('attribute_id', attribute?.id)
          .in('option_id', productConcernIds)
          .neq('product_id', productId)

        // Score and rank suggestions
        const boosterScores = new Map<string, {
          id: string
          title: string
          thumbnail?: string
          score: number
          sharedConcerns: string[]
          isAddon: boolean
        }>()

        for (const mapping of sharedBoosters || []) {
          const product = mapping.products as any
          if (!product || product.status !== 'published') continue

          const isAddon = product.product_types?.is_addon || product.metadata?.is_addon
          if (!isAddon) continue // Only suggest addons/boosters

          const existing = boosterScores.get(product.id)
          const concernName = concernNameMap[mapping.option_id] || 'Unknown'
          const score = 3 // Simple count

          if (existing) {
            existing.score += score
            if (!existing.sharedConcerns.includes(concernName)) {
              existing.sharedConcerns.push(concernName)
            }
          } else {
            boosterScores.set(product.id, {
              id: product.id,
              title: product.title,
              thumbnail: product.thumbnail,
              score,
              sharedConcerns: [concernName],
              isAddon: true
            })
          }
        }

        // Sort by score and exclude already matched
        suggestions = Array.from(boosterScores.values())
          .filter(s => !addonIds.includes(s.id))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
      }
    }

    return NextResponse.json({ addonIds, suggestions })
  } catch (error: any) {
    console.error('Error in GET addon-matches:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Save addon matches for a product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, addonIds } = body

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    // Delete existing matches
    await supabase
      .from('product_addon_matches')
      .delete()
      .eq('product_id', productId)

    // Insert new matches
    if (addonIds && addonIds.length > 0) {
      const inserts = addonIds.map((addonId: string, index: number) => ({
        product_id: productId,
        addon_product_id: addonId,
        display_order: index
      }))

      const { error: insertError } = await supabase
        .from('product_addon_matches')
        .insert(inserts)

      if (insertError) {
        console.error('Error inserting matches:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, count: addonIds?.length || 0 })
  } catch (error: any) {
    console.error('Error in PUT addon-matches:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Auto-generate addon matches for all products using shared concerns logic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessUnitId, productId } = body

    // If productId provided, only process that product
    // Otherwise, process all products in business unit

    // Get all products (non-addons) with their concerns
    let productQuery = supabase
      .from('products')
      .select(`
        id, title, business_unit_id,
        product_types(is_addon),
        metadata
      `)
      .is('deleted_at', null)
      .eq('status', 'published')

    if (productId) {
      productQuery = productQuery.eq('id', productId)
    } else if (businessUnitId) {
      productQuery = productQuery.eq('business_unit_id', businessUnitId)
    }

    const { data: products, error: prodError } = await productQuery

    if (prodError) throw prodError

    // Filter to non-addon products only
    const baseProducts = (products || []).filter(p => {
      const isAddon = p.product_types?.is_addon || p.metadata?.is_addon
      return !isAddon
    })

    if (baseProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No base products to process',
        processed: 0,
        matches: 0
      })
    }

    // Get skin_concerns attribute ID
    const { data: attribute } = await supabase
      .from('product_attributes')
      .select('id')
      .eq('handle', 'skin_concerns')
      .single()

    // Get all product-concern mappings from product_attribute_values
    const { data: allMappings } = await supabase
      .from('product_attribute_values')
      .select(`
        product_id,
        option_id
      `)
      .eq('attribute_id', attribute?.id)

    // Build concern-to-products map
    const concernToProducts = new Map<string, string[]>()
    const productToConcerns = new Map<string, string[]>()

    for (const mapping of allMappings || []) {
      // Concern -> Products
      const existing = concernToProducts.get(mapping.option_id) || []
      existing.push(mapping.product_id)
      concernToProducts.set(mapping.option_id, existing)

      // Product -> Concerns
      const prodConcerns = productToConcerns.get(mapping.product_id) || []
      prodConcerns.push(mapping.option_id)
      productToConcerns.set(mapping.product_id, prodConcerns)
    }

    // Get all boosters (addon products)
    const { data: allBoosters } = await supabase
      .from('products')
      .select(`
        id, title,
        product_types(is_addon),
        metadata
      `)
      .is('deleted_at', null)
      .eq('status', 'published')

    const boosterIds = new Set(
      (allBoosters || [])
        .filter(p => p.product_types?.is_addon || p.metadata?.is_addon)
        .map(p => p.id)
    )

    let totalMatches = 0
    const results: { productId: string; title: string; matchCount: number }[] = []

    // For each base product, find boosters that share concerns
    for (const product of baseProducts) {
      const productConcerns = productToConcerns.get(product.id) || []

      if (productConcerns.length === 0) {
        results.push({ productId: product.id, title: product.title, matchCount: 0 })
        continue
      }

      // Find boosters that share any concern
      const boosterScores = new Map<string, number>()

      for (const concernId of productConcerns) {
        const productsWithConcern = concernToProducts.get(concernId) || []
        for (const pid of productsWithConcern) {
          if (pid === product.id) continue // Skip self
          if (!boosterIds.has(pid)) continue // Only boosters

          const currentScore = boosterScores.get(pid) || 0
          boosterScores.set(pid, currentScore + 1) // Simple count of shared concerns
        }
      }

      // Get top boosters (at least 1 shared concern)
      const matchedBoosters = Array.from(boosterScores.entries())
        .filter(([, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id)

      // Delete existing matches for this product
      await supabase
        .from('product_addon_matches')
        .delete()
        .eq('product_id', product.id)

      // Insert new matches
      if (matchedBoosters.length > 0) {
        const inserts = matchedBoosters.map((addonId, index) => ({
          product_id: product.id,
          addon_product_id: addonId,
          display_order: index
        }))

        await supabase
          .from('product_addon_matches')
          .insert(inserts)

        totalMatches += matchedBoosters.length
      }

      results.push({
        productId: product.id,
        title: product.title,
        matchCount: matchedBoosters.length
      })
    }

    return NextResponse.json({
      success: true,
      processed: baseProducts.length,
      matches: totalMatches,
      results
    })

  } catch (error: any) {
    console.error('Error in POST addon-matches (auto-generate):', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
