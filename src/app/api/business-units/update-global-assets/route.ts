import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { businessUnitId, globalAnnouncement, globalNavigation, globalFooter } = await request.json()

    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business Unit ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (globalAnnouncement !== undefined) updateData.global_announcement = globalAnnouncement
    if (globalNavigation !== undefined) updateData.global_navigation = globalNavigation
    if (globalFooter !== undefined) updateData.global_footer = globalFooter

    const { error } = await supabase
      .from('business_units')
      .update(updateData)
      .eq('id', businessUnitId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Update global assets error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
