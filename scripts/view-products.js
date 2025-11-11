const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function viewProducts() {
  try {
    console.log('📊 Fetching all products from database...\n')

    const { data: products, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .order('product_name')

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    console.log(`✅ Found ${count} products in database\n`)
    console.log('='.repeat(80))

    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.product_name}`)
      console.log(`   Tagline: ${product.tagline}`)
      console.log(`   Trade Name: ${product.trade_name || 'N/A'}`)
      console.log(`   Cost (2ml): $${product.cost_2ml || 'N/A'}`)
      console.log(`   Retail (2ml): $${product.retail_2ml || 'N/A'}`)
      console.log(`   Retail (30ml): $${product.retail_30ml || 'N/A'}`)
      console.log(`   Key Actives: ${product.key_actives?.substring(0, 80) || 'N/A'}...`)
      console.log(`   Created: ${new Date(product.created_at).toLocaleString()}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log(`\n📋 Total: ${count} products`)
    console.log('\n🌐 View in Supabase dashboard:')
    console.log('   https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/editor')

  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

viewProducts()
