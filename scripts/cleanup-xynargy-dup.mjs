import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g,'')]))
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
// Delete empty home row (user's original — no blocks)
const { data: rows } = await supabase.from('landing_pages').select('id,updated_at,blocks').eq('id','4a80229e-294e-42e5-a408-ba2ac782a756').single()
console.log('Empty row blocks length:', rows?.blocks?.length)
const { error } = await supabase.from('landing_pages').delete().eq('id','4a80229e-294e-42e5-a408-ba2ac782a756')
if (error) console.error(error); else console.log('✅ Deleted empty dup home row')
