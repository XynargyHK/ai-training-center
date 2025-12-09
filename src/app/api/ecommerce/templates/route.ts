import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all product templates
export async function GET(request: NextRequest) {
  try {
    const { data: templates, error } = await supabase
      .from('product_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
