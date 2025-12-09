/**
 * Skincare Quiz API
 * POST - Start a new quiz / Save quiz progress
 * GET - Get quiz questions configuration
 * PUT - Update quiz answers
 * GET with profileId - Get existing profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Quiz questions configuration
const QUIZ_CONFIG = {
  steps: [
    {
      id: 1,
      title: 'About You',
      description: 'Help us understand your basics',
      questions: [
        {
          id: 'gender',
          type: 'single',
          question: 'What is your gender?',
          options: [
            { value: 'female', label: 'Female' },
            { value: 'male', label: 'Male' },
            { value: 'other', label: 'Other' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' }
          ]
        },
        {
          id: 'age_group',
          type: 'single',
          question: 'What is your age group?',
          options: [
            { value: '18-25', label: '18-25' },
            { value: '26-35', label: '26-35' },
            { value: '36-45', label: '36-45' },
            { value: '46-55', label: '46-55' },
            { value: '55+', label: '55+' }
          ]
        },
        {
          id: 'climate',
          type: 'single',
          question: 'What climate do you live in?',
          options: [
            { value: 'humid', label: 'Humid' },
            { value: 'dry', label: 'Dry' },
            { value: 'tropical', label: 'Tropical' },
            { value: 'temperate', label: 'Temperate' },
            { value: 'cold', label: 'Cold' }
          ]
        }
      ]
    },
    {
      id: 2,
      title: 'Your Skin',
      description: 'Tell us about your skin type',
      questions: [
        {
          id: 'skin_type',
          type: 'single',
          question: 'What is your skin type?',
          options: [
            { value: 'oily', label: 'Oily', description: 'Shiny, prone to breakouts' },
            { value: 'dry', label: 'Dry', description: 'Tight, flaky, rough' },
            { value: 'combination', label: 'Combination', description: 'Oily T-zone, dry cheeks' },
            { value: 'sensitive', label: 'Sensitive', description: 'Easily irritated, reactive' },
            { value: 'normal', label: 'Normal', description: 'Balanced, few issues' }
          ]
        },
        {
          id: 'skin_tone',
          type: 'single',
          question: 'What is your skin tone?',
          options: [
            { value: 'fair', label: 'Fair' },
            { value: 'medium', label: 'Medium' },
            { value: 'olive', label: 'Olive' },
            { value: 'dark', label: 'Dark' }
          ]
        },
        {
          id: 'sun_exposure',
          type: 'single',
          question: 'How often are you exposed to the sun?',
          options: [
            { value: 'rarely', label: 'Rarely', description: 'Mostly indoors' },
            { value: 'sometimes', label: 'Sometimes', description: 'A few hours daily' },
            { value: 'often', label: 'Often', description: 'Frequently outdoors' }
          ]
        }
      ]
    },
    {
      id: 3,
      title: 'Your Concerns',
      description: 'Select the skin concerns you want to address',
      questions: [
        {
          id: 'concerns',
          type: 'concerns_multi',
          question: 'What are your main skin concerns?',
          description: 'Select all that apply. You can mark your top priorities.',
          // Options loaded dynamically from product_attribute_options
          options: []
        }
      ]
    },
    {
      id: 4,
      title: 'Your Preferences',
      description: 'Help us tailor your recommendations',
      questions: [
        {
          id: 'current_routine',
          type: 'single',
          question: 'What is your current skincare routine?',
          options: [
            { value: 'none', label: 'None', description: 'I don\'t use any skincare' },
            { value: 'basic', label: 'Basic', description: 'Cleanser + moisturizer' },
            { value: 'advanced', label: 'Advanced', description: 'Multiple products daily' }
          ]
        },
        {
          id: 'product_preference',
          type: 'single',
          question: 'What type of products do you prefer?',
          options: [
            { value: 'natural', label: 'Natural', description: 'Plant-based, organic' },
            { value: 'clinical', label: 'Clinical', description: 'Science-backed, active ingredients' },
            { value: 'no_preference', label: 'No Preference', description: 'Whatever works best' }
          ]
        },
        {
          id: 'monthly_budget',
          type: 'single',
          question: 'What is your monthly skincare budget?',
          options: [
            { value: '0-50', label: '$0 - $50' },
            { value: '50-100', label: '$50 - $100' },
            { value: '100-200', label: '$100 - $200' },
            { value: '200+', label: '$200+' }
          ]
        }
      ]
    }
  ]
}

// Helper to resolve business unit
async function resolveBusinessUnitId(param: string | null): Promise<string | null> {
  if (!param) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(param)) return param

  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', param)
    .single()

  return data?.id || null
}

// GET - Get quiz configuration or existing profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnitId') || searchParams.get('business_unit_id')
    const profileId = searchParams.get('profileId')

    // If profileId provided, return existing profile
    if (profileId) {
      const { data: profile, error } = await supabase
        .from('customer_profiles')
        .select(`
          *,
          customer_concerns(
            id,
            concern_id,
            severity,
            is_priority,
            category,
            product_attribute_options(id, name, handle, category_id, product_categories(handle))
          )
        `)
        .eq('id', profileId)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      return NextResponse.json({ profile })
    }

    // Otherwise return quiz config with concerns loaded
    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)

    // Load concerns from product_attribute_options (unified system)
    // First get the Skin Concerns attribute
    const { data: attribute } = await supabase
      .from('product_attributes')
      .select('id')
      .eq('business_unit_id', businessUnitId)
      .eq('handle', 'skin_concerns')
      .single()

    // Get concerns with their category info
    const { data: concerns } = await supabase
      .from('product_attribute_options')
      .select(`
        id, name, handle, display_order,
        product_categories(id, name, handle)
      `)
      .eq('attribute_id', attribute?.id)
      .order('display_order')

    // Group concerns by category handle
    const concernsByCategory = (concerns || []).reduce((acc: any, c: any) => {
      const categoryHandle = c.product_categories?.handle || 'face'
      if (!acc[categoryHandle]) acc[categoryHandle] = []
      acc[categoryHandle].push({
        value: c.id,
        label: c.name,
        handle: c.handle
      })
      return acc
    }, {})

    // Build config with concerns
    const config = {
      ...QUIZ_CONFIG,
      concerns: concernsByCategory
    }

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error('Error in GET quiz:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Start new quiz or save progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessUnitId,
      profileId,
      step,
      answers,
      email,
      name,
      source
    } = body

    const resolvedBuId = await resolveBusinessUnitId(businessUnitId)

    // If profileId exists, update existing profile
    if (profileId) {
      const updates: any = {
        updated_at: new Date().toISOString(),
        quiz_step: step
      }

      // Map answers to profile fields
      if (answers) {
        if (answers.gender) updates.gender = answers.gender
        if (answers.age_group) updates.age_group = answers.age_group
        if (answers.climate) updates.climate = answers.climate
        if (answers.skin_type) updates.skin_type = answers.skin_type
        if (answers.skin_tone) updates.skin_tone = answers.skin_tone
        if (answers.sun_exposure) updates.sun_exposure = answers.sun_exposure
        if (answers.current_routine) updates.current_routine = answers.current_routine
        if (answers.product_preference) updates.product_preference = answers.product_preference
        if (answers.monthly_budget) updates.monthly_budget = answers.monthly_budget
      }

      if (email) updates.email = email
      if (name) updates.name = name

      // Check if quiz is complete (step 4 finished)
      if (step >= 4) {
        updates.quiz_completed = true
        updates.quiz_completed_at = new Date().toISOString()
      }

      const { data: profile, error } = await supabase
        .from('customer_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single()

      if (error) throw error

      // Handle concerns (step 3) - uses product_attribute_options
      if (answers?.concerns && Array.isArray(answers.concerns)) {
        // Delete existing concerns
        await supabase
          .from('customer_concerns')
          .delete()
          .eq('profile_id', profileId)

        // Insert new concerns
        if (answers.concerns.length > 0) {
          // Get concern categories from product_attribute_options
          const concernIds = answers.concerns.map((c: any) => c.concern_id || c.id || c)
          const { data: concernData } = await supabase
            .from('product_attribute_options')
            .select('id, product_categories(handle)')
            .in('id', concernIds)

          const categoryMap = (concernData || []).reduce((acc: any, c: any) => {
            acc[c.id] = c.product_categories?.handle || 'face'
            return acc
          }, {})

          const inserts = answers.concerns.map((c: any) => {
            const concernId = c.concern_id || c.id || c
            return {
              profile_id: profileId,
              concern_id: concernId,
              severity: c.severity || 3,
              is_priority: c.is_priority || false,
              category: categoryMap[concernId]
            }
          })

          await supabase.from('customer_concerns').insert(inserts)
        }
      }

      return NextResponse.json({ profile, profileId })
    }

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('customer_profiles')
      .insert({
        business_unit_id: resolvedBuId,
        email,
        name,
        source: source || 'website',
        quiz_step: 1,
        ...answers
      })
      .select()
      .single()

    if (createError) throw createError

    return NextResponse.json({
      profile: newProfile,
      profileId: newProfile.id
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error in POST quiz:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update specific answers
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId, concerns } = body

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    }

    // Update concerns
    if (concerns && Array.isArray(concerns)) {
      // Delete existing
      await supabase
        .from('customer_concerns')
        .delete()
        .eq('profile_id', profileId)

      // Get categories from product_attribute_options
      const concernIds = concerns.map((c: any) => c.concern_id || c.id || c)
      const { data: concernData } = await supabase
        .from('product_attribute_options')
        .select('id, product_categories(handle)')
        .in('id', concernIds)

      const categoryMap = (concernData || []).reduce((acc: any, c: any) => {
        acc[c.id] = c.product_categories?.handle || 'face'
        return acc
      }, {})

      // Insert new
      const inserts = concerns.map((c: any) => {
        const concernId = c.concern_id || c.id || c
        return {
          profile_id: profileId,
          concern_id: concernId,
          severity: c.severity || 3,
          is_priority: c.is_priority || false,
          category: categoryMap[concernId]
        }
      })

      await supabase.from('customer_concerns').insert(inserts)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in PUT quiz:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
