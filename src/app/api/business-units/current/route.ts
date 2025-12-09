/**
 * Get current business unit
 * GET /api/business-units/current
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the first business unit (or use a specific one based on your needs)
    const { data: businessUnits, error } = await supabase
      .from('business_units')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching business unit:', error)
      return NextResponse.json(
        { error: 'Failed to fetch business unit' },
        { status: 500 }
      )
    }

    return NextResponse.json({ businessUnit: businessUnits })
  } catch (error: any) {
    console.error('Error in current business unit endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
