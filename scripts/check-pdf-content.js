import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://utqxzbnbqwuxwonxhryn.supabase.co',
  'sb_secret_HOzYsxwGKbwqIRXl0MGvaA_f8fNNV_3'
)

const { data, error } = await supabase
  .from('knowledge_base')
  .select('topic, content')
  .eq('topic', 'Creating and publishing a professional book')
  .limit(1)

if (error) {
  console.error('Error:', error)
} else if (data && data.length > 0) {
  console.log('Topic:', data[0].topic)
  console.log('\nContent Preview (first 2000 chars):')
  console.log(data[0].content.substring(0, 2000))
  console.log('\n...')
  console.log('\nTotal content length:', data[0].content.length, 'characters')
} else {
  console.log('No data found')
}
