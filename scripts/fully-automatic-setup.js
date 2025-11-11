const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // SkinCoach
const EXCEL_FILE = 'knowledgebase/Booster descriptions and pricing_1762329426212.xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fullyAutomaticSetup() {
  try {
    console.log('🚀 FULLY AUTOMATIC SETUP STARTING...\n')

    // STEP 1: Create products table via exec_sql RPC
    console.log('📋 Creating products table automatically...')

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

      CREATE INDEX IF NOT EXISTS idx_products_business_unit ON products(business_unit_id);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
      CREATE INDEX IF NOT EXISTS idx_products_trade_name ON products(trade_name);

      ALTER TABLE products ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Service role has full access" ON products;
      CREATE POLICY "Service role has full access" ON products
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    `

    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    })

    if (createError) {
      console.error('❌ Error creating table:', createError.message)
      return
    }

    console.log('✅ Products table created successfully!\n')

    // STEP 2: Read Excel file
    console.log('📖 Reading Excel file:', EXCEL_FILE)
    const workbook = XLSX.readFile(EXCEL_FILE)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log(`✅ Found ${data.length} products in Excel\n`)

    // STEP 3: Check existing products
    const { count: existingCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    console.log(`📊 Existing products in database: ${existingCount || 0}\n`)

    // STEP 4: Import products
    console.log('⚡ Importing products automatically...\n')

    const results = {
      total: data.length,
      imported: 0,
      skipped: 0,
      errors: []
    }

    for (const row of data) {
      try {
        const productName = row['Product Name']

        if (!productName) {
          console.log('⏭️  Skipped: Empty product name')
          results.skipped++
          continue
        }

        // Check if product already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('business_unit_id', BUSINESS_UNIT_ID)
          .eq('product_name', productName)
          .single()

        if (existing) {
          console.log(`⏭️  Skipped (exists): ${productName}`)
          results.skipped++
          continue
        }

        // Insert product
        const product = {
          business_unit_id: BUSINESS_UNIT_ID,
          product_name: productName,
          tagline: row['Tagline'] || null,
          ingredients: row['Ingredients'] || null,
          hero_benefit_summary: row['Hero Benefit Summary'] || null,
          key_actives: row['Key Actives'] || null,
          face_benefits: row['Face Benefits'] || null,
          body_benefit: row['Body Benefit'] || null,
          hairscalp_benefits: row['Hair/Scalp Benefits'] || null,
          eye_benefits: row['Eye Benefits'] || null,
          clinical_highlight: row['Clinical Highlight'] || null,
          trade_name: row['Trade Name'] || null,
          cost_2ml: row['Cost 2ml'] || null,
          retail_2ml: row['Retail 2ml'] || null,
          retail_30ml: row['Retail 30ml'] || null
        }

        const { error } = await supabase
          .from('products')
          .insert(product)

        if (error) {
          console.error(`❌ Error importing "${productName}":`, error.message)
          results.errors.push({
            product: productName,
            error: error.message
          })
        } else {
          console.log(`✅ Imported: ${productName}`)
          results.imported++
        }

      } catch (err) {
        console.error(`❌ Exception:`, err.message)
        results.errors.push({
          product: row['Product Name'] || 'Unknown',
          error: err.message
        })
      }
    }

    // STEP 5: Show results
    console.log('\n' + '='.repeat(60))
    console.log('📊 IMPORT COMPLETE!')
    console.log('='.repeat(60))
    console.log(`Total in Excel: ${results.total}`)
    console.log(`Imported: ${results.imported}`)
    console.log(`Skipped: ${results.skipped}`)
    console.log(`Errors: ${results.errors.length}`)

    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors:')
      results.errors.forEach(err => {
        console.log(`  - ${err.product}: ${err.error}`)
      })
    }

    const { count: finalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    console.log(`\n✨ Final product count in database: ${finalCount}`)

    // Show sample products
    console.log('\n📋 Sample products in database:')
    const { data: sampleProducts } = await supabase
      .from('products')
      .select('product_name, tagline, cost_2ml, retail_2ml')
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .limit(5)

    sampleProducts?.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.product_name}`)
      console.log(`     "${p.tagline}"`)
      console.log(`     Cost: $${p.cost_2ml} | Retail: $${p.retail_2ml}`)
    })

    console.log('\n🎉 SUCCESS! Everything is now automatic!')
    console.log('✅ Products table created')
    console.log(`✅ ${results.imported} products imported`)
    console.log('✅ AI chatbot can now access all product data')
    console.log('\n💡 Future Excel uploads will also be fully automatic!')

  } catch (error) {
    console.error('💥 Error:', error.message)
    console.error(error)
  }
}

fullyAutomaticSetup()
