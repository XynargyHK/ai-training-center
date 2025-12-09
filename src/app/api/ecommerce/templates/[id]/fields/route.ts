import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get fields for a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: fields, error } = await supabase
      .from('template_fields')
      .select('*')
      .eq('template_id', id)
      .order('display_order')

    if (error) throw error

    return NextResponse.json({ fields })
  } catch (error: any) {
    console.error('Error fetching template fields:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template fields' },
      { status: 500 }
    )
  }
}
