const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // SkinCoach
const EXCEL_FILE = 'knowledgebase/Booster descriptions and pricing_1762329426212.xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function importProducts() {
  try {
    console.log('🚀 Starting automatic product import...\n')

    // STEP 1: Read Excel file
    console.log('📖 Reading Excel file:', EXCEL_FILE)
    const workbook = XLSX.readFile(EXCEL_FILE)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON (first row as headers)
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log(`✅ Found ${data.length} products in Excel\n`)

    if (data.length === 0) {
      console.log('⚠️  No data to import')
      return
    }

    // Show sample
    console.log('📋 Sample product:')
    console.log(JSON.stringify(data[0], null, 2))
    console.log('')

    // STEP 2: Check if products table exists
    console.log('🔍 Checking if products table exists...')

    const { error: tableCheckError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.error('❌ Products table not found!')
      console.log('\n📋 Please set up the products table first:\n')
      console.log('  🌐 Visit: http://localhost:3000/setup-products')
      console.log('  📝 Follow the 2-step setup instructions')
      console.log('  ⚡ Takes less than 2 minutes!\n')
      console.log('💡 Or go directly to Supabase:')
      console.log('   https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/sql/new\n')
      return
    }

    console.log('✅ Products table found!')

    // STEP 3: Check existing products
    const { count: existingCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    console.log(`📊 Existing products in database: ${existingCount || 0}\n`)

    // STEP 4: Import products
    console.log('⚡ Importing products...\n')

    const results = {
      total: data.length,
      imported: 0,
      skipped: 0,
      errors: []
    }

    for (const row of data) {
      try {
        // Map Excel columns to database columns
        const product = {
          business_unit_id: BUSINESS_UNIT_ID,
          product_name: row['Product Name'] || null,
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

        // Check if product already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('business_unit_id', BUSINESS_UNIT_ID)
          .eq('product_name', product.product_name)
          .single()

        if (existing) {
          console.log(`⏭️  Skipped (exists): ${product.product_name}`)
          results.skipped++
          continue
        }

        // Insert product
        const { error } = await supabase
          .from('products')
          .insert(product)

        if (error) {
          console.error(`❌ Error importing "${product.product_name}":`, error.message)
          results.errors.push({
            product: product.product_name,
            error: error.message
          })
        } else {
          console.log(`✅ Imported: ${product.product_name}`)
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

    // STEP 5: Verify final count
    console.log('\n📊 Import Results:')
    console.log('=' .repeat(50))
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
      .select('product_name, tagline, cost_2ml')
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .limit(5)

    sampleProducts?.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.product_name} - ${p.tagline}`)
    })

    console.log('\n🎉 Product import complete!')

  } catch (error) {
    console.error('💥 Import error:', error.message)
    console.error(error)
  }
}

importProducts()
