import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * AUTO-CREATE PRODUCTS TABLE
 * Dynamically creates products table based on Excel schema
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creating products table...')

    // Create products table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

        product_name TEXT,
        tagline TEXT,
        ingredients TEXT,
        hero_benefit_summary TEXT,
        key_actives TEXT,
        face_benefits TEXT,
        body_benefit TEXT,
        hairscalp_benefits TEXT,
        eye_benefits TEXT,
        clinical_highlight TEXT,
        trade_name TEXT,
        cost_2ml DECIMAL(10,2),
        retail_2ml TEXT,
        retail_30ml TEXT,

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_products_business_unit ON products(business_unit_id);
    `

    // Execute table creation
    const { error: tableError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: createTableSQL
    }).single()

    if (tableError) {
      console.log('⚠️  RPC exec_sql not available, trying direct approach...')

      // Alternative: Try to verify table exists by querying it
      const { error: checkError } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(0)

      if (checkError) {
        throw new Error(`Table creation needed. Please run SQL manually: ${checkError.message}`)
      }
    }

    // Execute index creation
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: createIndexSQL
    }).single()

    // Verify table exists
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(1)

    if (verifyError) {
      return NextResponse.json({
        success: false,
        error: 'Products table not found. SQL execution may be required.',
        sqlNeeded: createTableSQL + '\n\n' + createIndexSQL,
        message: 'Please run the SQL in Supabase SQL Editor or enable RPC function exec_sql'
      }, { status: 500 })
    }

    console.log('✅ Products table ready!')

    return NextResponse.json({
      success: true,
      message: 'Products table created successfully',
      columns: [
        'product_name', 'tagline', 'ingredients', 'hero_benefit_summary',
        'key_actives', 'face_benefits', 'body_benefit', 'hairscalp_benefits',
        'eye_benefits', 'clinical_highlight', 'trade_name',
        'cost_2ml', 'retail_2ml', 'retail_30ml'
      ]
    })

  } catch (error: any) {
    console.error('💥 Error creating products table:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// GET: Check if products table exists
export async function GET(request: NextRequest) {
  try {
    const { data, error, count } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        tableExists: false,
        error: error.message
      })
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      totalProducts: count || 0,
      sampleProducts: data || []
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      tableExists: false,
      error: error.message
    })
  }
}
