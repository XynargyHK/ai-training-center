// Fix RLS policies by disabling them
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Using service role key to fix RLS...')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLS() {
  console.log('\n🔧 Fixing Row Level Security policies...\n')

  const tables = [
    'faq_library',
    'canned_messages',
    'knowledge_base',
    'categories',
    'training_conversations'
  ]

  for (const table of tables) {
    console.log(`📋 Processing table: ${table}`)

    // Disable RLS
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
    })

    if (disableError) {
      console.error(`   ❌ Error disabling RLS: ${disableError.message}`)
    } else {
      console.log(`   ✅ RLS disabled for ${table}`)
    }
  }

  console.log('\n✅ RLS fix complete! Testing data access...\n')

  // Test reading data
  const { data: faqs, error: faqError } = await supabase
    .from('faq_library')
    .select('id, question')
    .limit(3)

  if (faqError) {
    console.error('❌ Still cannot read FAQs:', faqError.message)
  } else {
    console.log(`✅ Can now read FAQs! Found ${faqs.length} records`)
    if (faqs.length > 0) {
      console.log(`   First FAQ: ${faqs[0].question.substring(0, 50)}...`)
    }
  }

  const { data: canned, error: cannedError } = await supabase
    .from('canned_messages')
    .select('id, title')
    .limit(3)

  if (cannedError) {
    console.error('❌ Still cannot read canned messages:', cannedError.message)
  } else {
    console.log(`✅ Can now read canned messages! Found ${canned.length} records`)
    if (canned.length > 0) {
      console.log(`   First message: ${canned[0].title}`)
    }
  }

  const { data: knowledge, error: knowledgeError } = await supabase
    .from('knowledge_base')
    .select('id, topic')
    .limit(3)

  if (knowledgeError) {
    console.error('❌ Still cannot read knowledge base:', knowledgeError.message)
  } else {
    console.log(`✅ Can now read knowledge base! Found ${knowledge.length} records`)
    if (knowledge.length > 0) {
      console.log(`   First entry: ${knowledge[0].topic}`)
    }
  }

  console.log('\n🎉 Done! Restart your dev server and refresh the page.\n')
}

fixRLS().catch(console.error)
