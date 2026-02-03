const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixLLMConfig() {
  console.log('🔧 Updating LLM configuration to use Google Gemini...\n')

  // Update all LLM configs to use Google Gemini
  const { data, error } = await supabase
    .from('llm_config')
    .update({
      provider: 'google',
      model: 'gemini-2.5-flash',
      updated_at: new Date().toISOString()
    })
    .neq('provider', 'google') // Only update non-Google configs

  if (error) {
    console.error('❌ Error updating LLM config:', error)
    return
  }

  console.log('✅ LLM configuration updated successfully!')
  console.log('   Provider: google')
  console.log('   Model: gemini-2.5-flash')
}

fixLLMConfig()
