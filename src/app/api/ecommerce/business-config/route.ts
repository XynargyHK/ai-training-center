import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get business unit product configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitId = searchParams.get('businessUnitId')

    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'businessUnitId is required' },
        { status: 400 }
      )
    }

    // Get the business unit config
    const { data: config, error: configError } = await supabase
      .from('business_unit_product_config')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .single()

    // Get custom field definitions
    const { data: fields, error: fieldsError } = await supabase
      .from('product_field_definitions')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .order('display_order')

    // Config might not exist yet (not an error)
    return NextResponse.json({
      config: config || null,
      fields: fields || []
    })
  } catch (error: any) {
    console.error('Error fetching business config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// POST - Save business unit product configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessUnitId, templateId, referenceUrl, fields } = body

    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'businessUnitId is required' },
        { status: 400 }
      )
    }

    // Upsert the config
    const { data: config, error: configError } = await supabase
      .from('business_unit_product_config')
      .upsert({
        business_unit_id: businessUnitId,
        template_id: templateId || null,
        reference_url: referenceUrl || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'business_unit_id'
      })
      .select()
      .single()

    if (configError) throw configError

    // Delete existing field definitions
    await supabase
      .from('product_field_definitions')
      .delete()
      .eq('business_unit_id', businessUnitId)

    // Insert new field definitions
    if (fields && fields.length > 0) {
      const fieldRecords = fields.map((field: any, index: number) => ({
        business_unit_id: businessUnitId,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type || 'text',
        field_options: field.field_options || null,
        display_section: field.display_section || 'main',
        display_order: field.display_order ?? index,
        is_required: field.is_required || false,
        is_from_template: field.is_from_template || false,
        placeholder: field.placeholder || null,
        help_text: field.help_text || null,
      }))

      const { error: fieldsError } = await supabase
        .from('product_field_definitions')
        .insert(fieldRecords)

      if (fieldsError) throw fieldsError
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Configuration saved successfully'
    })
  } catch (error: any) {
    console.error('Error saving business config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
