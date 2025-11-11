const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanupAndRemigrate() {
  try {
    console.log('🧹 Cleaning up incorrect canned messages...\n')

    // Delete all canned messages with null or undefined titles
    const { data: deleted, error } = await supabase
      .from('canned_messages')
      .delete()
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .is('title', null)

    if (error) {
      console.log('No records to delete or error:', error.message)
    } else {
      console.log(`✅ Deleted ${deleted?.length || 0} incorrect records`)
    }

    console.log('\n🎉 Cleanup complete! Now run migrate-with-categories.js again')

  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

cleanupAndRemigrate()
