/**
 * Product Locales API
 * GET /api/ecommerce/products/locales?businessUnit=X
 * Returns distinct (country, language_code) pairs with product count per locale
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function resolveBusinessUnitId(param: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(param)) return param

  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', param)
    .single()

  return data?.id || null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnit')

    if (!businessUnitParam) {
      return NextResponse.json({ error: 'businessUnit parameter required' }, { status: 400 })
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Get distinct locales with product counts
    const { data: products, error } = await supabase
      .from('products')
      .select('country, language_code')
      .eq('business_unit_id', businessUnitId)
      .is('deleted_at', null)

    if (error) {
      console.error('Error fetching product locales:', error)
      return NextResponse.json({ error: 'Failed to fetch locales' }, { status: 500 })
    }

    // Aggregate counts per locale
    const localeMap: Record<string, { country: string; language_code: string; product_count: number }> = {}
    for (const p of (products || [])) {
      const key = `${p.country || 'US'}-${p.language_code || 'en'}`
      if (!localeMap[key]) {
        localeMap[key] = {
          country: p.country || 'US',
          language_code: p.language_code || 'en',
          product_count: 0
        }
      }
      localeMap[key].product_count++
    }

    const locales = Object.values(localeMap).sort((a, b) => {
      if (a.country !== b.country) return a.country.localeCompare(b.country)
      return a.language_code.localeCompare(b.language_code)
    })

    // If no products exist yet, return a default US/en locale
    if (locales.length === 0) {
      locales.push({ country: 'US', language_code: 'en', product_count: 0 })
    }

    return NextResponse.json({ success: true, locales })
  } catch (err) {
    console.error('Product locales API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
