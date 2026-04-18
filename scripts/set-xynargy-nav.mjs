// One-shot: set xynargy BU's global_navigation with dark-teal nav colors
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => {
  const [k, ...v] = l.split('=')
  return [k.trim(), v.join('=').trim().replace(/^["']|["']$/g, '')]
}))
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const MENU_ITEMS = [
  { label: '首頁', url: '/', enabled: true },
  { label: '生產工藝', url: '/pages/our-company', enabled: true },
  { label: '納米科技', url: '/pages/tech', enabled: true },
  { label: '產品研發', url: '/pages/research', enabled: true },
  { label: '產品安全', url: '/pages/safety', enabled: true },
  { label: '成功案例', url: '/pages/case-studies', enabled: true },
  { label: '產品目錄', url: '/collections/all', enabled: true },
  { label: '聯系我們', url: '/pages/contact', enabled: true },
  { label: '獎勵計劃', url: '/pages/rewards', enabled: true },
]

const globalNav = {
  menu_items: MENU_ITEMS,
  nav_bg_color: '#2e5157',
  nav_text_color: '#ffffff',
  logo_text: 'XYNARGY',
  logo_position: 'left',
  show_search: true,
  show_account: true,
  show_cart: true,
}

const { error } = await supabase
  .from('business_units')
  .update({ global_navigation: globalNav })
  .eq('slug', 'xynargy')

if (error) { console.error(error); process.exit(1) }
console.log('✅ xynargy global_navigation set (teal bg + white menu)')
