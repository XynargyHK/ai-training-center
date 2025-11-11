const { Client } = require('pg')
const XLSX = require('xlsx')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // SkinCoach
const EXCEL_FILE = 'knowledgebase/Booster descriptions and pricing_1762329426212.xlsx'

// PostgreSQL connection string (pooler requires project reference in username)
const connectionString = `postgresql://postgres.utqxzbnbqwuxwonxhryn:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

async function autoSetupAndImport() {
  const client = new Client({ connectionString })

  try {
    console.log('🚀 Starting fully automatic setup and import...\n')

    // STEP 1: Connect to PostgreSQL
    console.log('🔌 Connecting to PostgreSQL database...')
    await client.connect()
    console.log('✅ Connected to database!\n')

    // STEP 2: Create products table
    console.log('📋 Creating products table...')
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

    await client.query(createTableSQL)
    console.log('✅ Products table created!\n')

    // STEP 3: Read Excel file
    console.log('📖 Reading Excel file:', EXCEL_FILE)
    const workbook = XLSX.readFile(EXCEL_FILE)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log(`✅ Found ${data.length} products in Excel\n`)

    // STEP 4: Check existing products
    const existingResult = await client.query(
      'SELECT COUNT(*) FROM products WHERE business_unit_id = $1',
      [BUSINESS_UNIT_ID]
    )
    const existingCount = parseInt(existingResult.rows[0].count)
    console.log(`📊 Existing products in database: ${existingCount}\n`)

    // STEP 5: Import products
    console.log('⚡ Importing products...\n')

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
        const checkResult = await client.query(
          'SELECT id FROM products WHERE business_unit_id = $1 AND product_name = $2',
          [BUSINESS_UNIT_ID, productName]
        )

        if (checkResult.rows.length > 0) {
          console.log(`⏭️  Skipped (exists): ${productName}`)
          results.skipped++
          continue
        }

        // Insert product
        const insertSQL = `
          INSERT INTO products (
            business_unit_id, product_name, tagline, ingredients,
            hero_benefit_summary, key_actives, face_benefits, body_benefit,
            hairscalp_benefits, eye_benefits, clinical_highlight, trade_name,
            cost_2ml, retail_2ml, retail_30ml
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `

        await client.query(insertSQL, [
          BUSINESS_UNIT_ID,
          productName,
          row['Tagline'] || null,
          row['Ingredients'] || null,
          row['Hero Benefit Summary'] || null,
          row['Key Actives'] || null,
          row['Face Benefits'] || null,
          row['Body Benefit'] || null,
          row['Hair/Scalp Benefits'] || null,
          row['Eye Benefits'] || null,
          row['Clinical Highlight'] || null,
          row['Trade Name'] || null,
          row['Cost 2ml'] || null,
          row['Retail 2ml'] || null,
          row['Retail 30ml'] || null
        ])

        console.log(`✅ Imported: ${productName}`)
        results.imported++

      } catch (err) {
        console.error(`❌ Error importing "${row['Product Name'] || 'Unknown'}":`, err.message)
        results.errors.push({
          product: row['Product Name'] || 'Unknown',
          error: err.message
        })
      }
    }

    // STEP 6: Verify final count
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

    const finalResult = await client.query(
      'SELECT COUNT(*) FROM products WHERE business_unit_id = $1',
      [BUSINESS_UNIT_ID]
    )
    const finalCount = parseInt(finalResult.rows[0].count)

    console.log(`\n✨ Final product count in database: ${finalCount}`)

    // Show sample products
    console.log('\n📋 Sample products in database:')
    const sampleResult = await client.query(
      'SELECT product_name, tagline, cost_2ml FROM products WHERE business_unit_id = $1 LIMIT 5',
      [BUSINESS_UNIT_ID]
    )

    sampleResult.rows.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.product_name} - ${p.tagline}`)
    })

    console.log('\n🎉 Setup and import complete!')
    console.log('✅ Products table created')
    console.log(`✅ ${results.imported} products imported`)
    console.log('\n💡 Next: Your AI chatbot can now query the products table!')

  } catch (error) {
    console.error('💥 Error:', error.message)
    console.error(error)
  } finally {
    await client.end()
    console.log('\n🔌 Database connection closed')
  }
}

autoSetupAndImport()
