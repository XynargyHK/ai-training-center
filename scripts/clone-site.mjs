#!/usr/bin/env node
/**
 * Clone a Shopify (or generic) website into our platform.
 *
 * Usage:
 *   node scripts/clone-site.mjs --url https://www.xynargy.hk --bu xynargy --country HK --lang tw
 *
 * What it does (Part 1 scope):
 *   1. Scrapes brand colors + primary font from the site's theme CSS.
 *   2. Extracts the top-nav menu items.
 *   3. Fetches /products.json (Shopify standard) → inserts into ecommerce_products.
 *   4. Builds a minimal home landing_page: hero video block (if YouTube found) +
 *      a product grid block → inserts via /api/landing-page.
 *   5. Saves the menu to the landing_page's menu_items JSON.
 *
 * Later parts will add: per-product pages, policies, visual-iteration loop.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'

// ---------- args ----------
const args = Object.fromEntries(
  process.argv.slice(2)
    .join(' ')
    .matchAll(/--(\w+)\s+(\S+)/g)
    .map(m => [m[1], m[2]])
)
const URL_BASE = args.url
const BU = args.bu
const COUNTRY = (args.country || 'US').toUpperCase()
const LANG = args.lang || 'en'
const API = process.env.API_BASE || 'http://localhost:3000'

if (!URL_BASE || !BU) {
  console.error('Usage: node scripts/clone-site.mjs --url <url> --bu <slug> [--country HK] [--lang tw]')
  process.exit(1)
}

// ---------- env ----------
const envFile = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=')
    return [k.trim(), v.join('=').trim().replace(/^["']|["']$/g, '')]
  })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const uid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
const block = (type, data, name) => ({ id: uid(), type, name: name || type, order: 0, data })
const absUrl = (u) => {
  if (!u) return ''
  if (u.startsWith('//')) return 'https:' + u
  if (u.startsWith('/')) return new URL(URL_BASE).origin + u
  return u
}

// ---------- 1. Scrape homepage HTML ----------
console.log(`\n🌐 Fetching ${URL_BASE}...`)
const homeHtml = await (await fetch(URL_BASE)).text()

// ---------- 2. Extract brand palette from theme CSS ----------
function extractBrand(html) {
  // Take ONLY the FIRST color scheme block (Shopify defines multiple schemes; first = primary)
  const firstScheme = html.match(/--color-background:[\s\S]*?(?=--color-background:|$)/)?.[0] || html
  const vars = Object.fromEntries(
    [...firstScheme.matchAll(/--color-([a-z-]+):\s*([^;"}]+)/g)].map(m => [m[1], m[2].trim()])
  )
  const rgbToHex = (r) => {
    if (!r) return null
    const m = r.match(/(\d+)\s+(\d+)\s+(\d+)/) || r.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (!m) return r.startsWith('#') ? r : null
    return '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('')
  }
  const fontMatch = html.match(/font-family:\s*([A-Za-z][\w\s,'"-]*)/)
  return {
    bg: rgbToHex(vars['background']) || '#ffffff',
    text: rgbToHex(vars['foreground']) || '#111111',
    accent: rgbToHex(vars['background-contrast']) || '#0f766e',
    heading: rgbToHex(vars['shadow']) || '#000000',
    button: rgbToHex(vars['button']) || '#000000',
    button_text: rgbToHex(vars['button-text']) || '#ffffff',
    font: (fontMatch?.[1] || 'Inter').trim().replace(/,.*$/, '').replace(/['"]/g, ''),
  }
}
const BRAND = extractBrand(homeHtml)
console.log('🎨 Brand palette:', BRAND)

// ---------- 3. Extract menu ----------
function extractMenu(html) {
  // Grab anchors anywhere that have /pages/, /collections/, or / routes (typical Shopify nav)
  const items = []
  const seen = new Set()
  const anchorRe = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  for (const m of html.matchAll(anchorRe)) {
    const href = m[1].trim()
    // Strip inner HTML (spans, svgs) to get visible text
    const label = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (!label || label.length < 2 || label.length > 20) continue
    if (!/^\/(pages|collections|products|policies)?\/?[a-zA-Z]/.test(href) && href !== '/') continue
    if (/^#|^javascript:/.test(href)) continue
    const key = href
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ label, url: href })
    if (items.length >= 12) break
  }
  return items
}
const menu = extractMenu(homeHtml)
console.log(`🧭 Menu: ${menu.length} items →`, menu.map(m => m.label).join(', '))

// ---------- 4. Extract YouTube hero video (if any) ----------
function extractYouTube(html) {
  const m = html.match(/youtube(?:\.com\/embed\/|\.com\/watch\?v=|\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}
const youtubeId = extractYouTube(homeHtml)
console.log(`📺 Hero video: ${youtubeId || 'none'}`)

// ---------- 5. Fetch /products.json (Shopify) ----------
let products = []
try {
  const res = await fetch(new URL('/products.json?limit=250', URL_BASE).toString())
  if (res.ok) {
    const j = await res.json()
    products = j.products || []
  }
} catch {}
console.log(`🛍️  Products: ${products.length}`)

// ---------- 6. Resolve BU to UUID ----------
const { data: buRow } = await supabase.from('business_units').select('id').eq('slug', BU).single()
if (!buRow) { console.error(`BU not found: ${BU}`); process.exit(1) }
const BU_UUID = buRow.id

// ---------- 7. Insert products via /api/ecommerce/products POST ----------
// Correct table is `products` (not ecommerce_products). Use the existing API.
let productInserts = 0, productSkips = 0
for (const p of products) {
  const variant = p.variants?.[0]
  const price = variant ? parseFloat(variant.price) : 0
  const payload = {
    business_unit_id: BU,
    title: p.title,
    description: (p.body_html || '').replace(/<[^>]+>/g, '').slice(0, 2000),
    tagline: p.title,
    status: 'active',
    thumbnail: p.images?.[0]?.src || null,
    images: (p.images || []).slice(0, 8).map(i => i.src),
    country: COUNTRY,
    language_code: LANG,
    price,
    compare_at_price: variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null,
    sku: variant?.sku || null,
    stock_quantity: variant?.inventory_quantity || 100,
    has_variants: false,
  }
  const r = await fetch(`${API}/api/ecommerce/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (r.ok) productInserts++
  else { productSkips++ ; const t = await r.text(); if (productSkips <= 2) console.log(`   ⚠ ${p.title}: ${t.slice(0,150)}`) }
}
console.log(`   ✓ ${productInserts} products inserted${productSkips ? `, ${productSkips} skipped/failed` : ''}`)

// ---------- 8. Build minimal home page blocks ----------
const homeBlocks = []

if (youtubeId) {
  homeBlocks.push(block('video', {
    video_url: youtubeId,
    video_type: 'youtube',
    aspect_ratio: '16/9',
    autoplay: true, muted: true, loop: true, controls: true,
    max_width: '100%',
    background_color: BRAND.bg,
  }, 'Hero Video'))
}

// Featured products grid (up to 4)
if (products.length) {
  for (const [i, p] of products.slice(0, 4).entries()) {
    homeBlocks.push(block('split', {
      layout: i % 2 === 0 ? 'image-right' : 'image-left',
      image_url: p.images?.[0]?.src || '',
      headline: p.title,
      headline_color: BRAND.heading,
      headline_font_family: BRAND.font,
      content: (p.body_html || '').replace(/<[^>]+>/g, '').slice(0, 250),
      content_color: BRAND.text,
      content_font_family: BRAND.font,
      cta_text: 'Buy Now',
      cta_url: `/products/${p.handle}`,
      background_color: BRAND.bg,
    }, p.title))
  }
}

// Browse all CTA
homeBlocks.push(block('static_banner', {
  headline: 'Browse all products',
  headline_color: BRAND.heading,
  headline_font_family: BRAND.font,
  headline_text_align: 'center',
  background_color: BRAND.bg,
  cta_text: 'Shop Now',
  cta_url: '/collections/all',
}, 'Browse CTA'))

// ---------- 9. Upsert the landing page ----------
const menuItems = menu.map(m => ({ label: m.label, url: m.url }))
const payload = {
  businessUnitId: BU,
  country: COUNTRY,
  language_code: LANG,
  slug: null,
  is_active: true,
  hero_type: 'carousel',
  hero_headline: '',
  hero_slides: [],
  announcements: [],
  blocks: homeBlocks.map((b, i) => ({ ...b, order: i })),
  menu_items: menuItems,
  footer: {},
}

const res = await fetch(`${API}/api/landing-page`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
const text = await res.text()
console.log(res.ok ? `✅ Home page saved (${homeBlocks.length} blocks, ${menuItems.length} menu items)`
                   : `❌ Save failed: ${text.slice(0, 200)}`)

console.log(`\nDone. Next: open editor at BU=${BU} ${COUNTRY}/${LANG} and review.`)
