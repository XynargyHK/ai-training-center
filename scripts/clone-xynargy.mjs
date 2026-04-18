#!/usr/bin/env node
// Clones xynargy.hk content into landing_pages for BU=xynargy, country=HK, language_code=tw
// Usage: node scripts/clone-xynargy.mjs

const API = process.env.API_BASE || 'http://localhost:3000'
const BU = 'xynargy'
const COUNTRY = 'HK'
const LANG = 'tw'

const img = (p) => `https:${p}`
const uid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))

// Xynargy brand palette — VISUAL-MATCHED to actual xynargy.hk screenshot
const BRAND = {
  bg: '#2e5157',           // dark teal hero bg
  bg_products: '#f5f3ef',  // off-white mid section for product grid
  accent: '#d46a5a',        // orange-coral (for 乳腺護理 headline)
  accent_soft: '#dcb5b5',   // dusty pink (promo card)
  text: '#484d5e',
  heading: '#121212',
  button: '#6d7a4e',        // olive button
  button_text: '#ffffff',
  font: 'Assistant',
}

function block(type, data, name) {
  // Explicit empty string means "no visible heading"; undefined falls back to a label
  const resolvedName = name === '' ? '' : (name || `${type} block`)
  return { id: uid(), type, name: resolvedName, order: 0, data }
}

// ────────────────────────────────────────────────────────────────
// PAGE 1: 首頁 (Home) — slug = null
// ────────────────────────────────────────────────────────────────
const homeBlocks = [
  // Hero — bg image already contains "乳腺護理" text & promo; no overlay needed
  block('static_banner', {
    background_url: img('//www.xynargy.hk/cdn/shop/files/Breast_care_banner_TR.png?v=1740821763&width=3840'),
    background_type: 'image',
    background_color: BRAND.bg,
    min_height: '80vh',
    headline: '',
    subheadline: '',
    cta_text: '',
    cta_url: '',
  }, '首頁 Hero'),

  // Intro paragraph — EXACT xynargy.hk copy (full paragraph right below the hero video)
  block('static_banner', {
    background_color: BRAND.bg_products,
    headline: '研發團隊透過多年努力。採集八種大學文獻確認抗癌原材料。',
    headline_font_size: 'clamp(1rem, 2vw, 1.25rem)',
    headline_font_family: BRAND.font,
    headline_color: BRAND.text,
    headline_text_align: 'center',
    subheadline: '根據【通】、【散】、【養】三種調理方案制定出四種主要產品：納米紅參茶樹精華乳液、納米靈芝薑黃素精華乳液、納米葡萄子緊緻精華乳液、納米山金車花精華乳液。',
    subheadline_font_size: '0.95rem',
    subheadline_font_family: BRAND.font,
    subheadline_color: BRAND.text,
    subheadline_text_align: 'center',
  }, '介紹段落'),

  // 4 products in a 2×2 card grid, horizontal layout (bottle-left, text-right) with olive CTA buttons
  block('card', {
    layout: 'grid-2',
    card_direction: 'horizontal',
    heading: '',
    background_color: BRAND.bg_products,
    bg_color: BRAND.bg_products,
    cards: [
      {
        image_url: img('//www.xynargy.hk/cdn/shop/files/XynargyNanoGinsengTeaTreeTherapyCream50ml.png?v=1724242640&width=1500'),
        title: '《通》1號 納米紅參茶樹精華乳液 50ml',
        content: '含高濃度韓國紅蔘、4-松油醇及咖啡因的獨特配方。具排水、減少腫脹和抗炎特性，有效改善靜脈曲張、纖維化組織和乳腺結節。',
        rating: 0,
        cta_text: '購買1號',
        cta_url: '/products/xynargy-nano-ginseng-tea-tree-therapy-cream',
        cta_color: BRAND.button,
        author: '',
      },
      {
        image_url: img('//www.xynargy.hk/cdn/shop/files/XynargyNanoReishiCurcuminTherapyCream50ml.png?v=1725492083&width=1500'),
        title: '《散》2號 納米靈芝薑黃素精華乳液 50ml',
        content: '含高濃度薑黃素及靈芝提取物。增加血液循環、鎮痛、排走毒素和抗炎，有效改善乳腺脹痛，並改善皮膚發炎包括濕疹等症狀。',
        rating: 0,
        cta_text: '購買2號',
        cta_url: '/products/xynargy-nano-reishi-curcumin-therapy-cream',
        cta_color: BRAND.button,
        author: '',
      },
      {
        image_url: img('//www.xynargy.hk/cdn/shop/files/1_2ArnicaMontanaTherapyCream1_250ml.png?v=1740127153&width=1500'),
        title: '《養》1+2號 納米山金車花精華乳液 (二合一配方)',
        content: '採用高濃度納米山金車花、咖啡因和茶樹精華獨特配製。具排水作用、抗發炎、改善脹痛並減少靜脈曲張、纖維化組織和結節。具抗腫瘤作用。',
        rating: 0,
        cta_text: '購買1+2號',
        cta_url: '/products/1-2-arnica-montana-therapy-cream',
        cta_color: BRAND.button,
        author: '',
      },
      {
        image_url: img('//www.xynargy.hk/cdn/shop/files/XynargyNanoGrapeSeedFirmingTherapyCream50ml.png?v=1725492410&width=1500'),
        title: '《豐》3號 納米葡萄籽緊緻精華乳液 50ml',
        content: '含高濃度玫瑰果、綠茶及葡萄籽提取物獨特配方。改善妊娠紋、牛皮癬。促進膠原蛋白再生，使皮膚緊緻年輕。葡萄籽具抗腫瘤及抗腫塊增長功效。',
        rating: 0,
        cta_text: '購買3號',
        cta_url: '/products/xynargy-nano-grape-seed-firming-therapy-cream',
        cta_color: BRAND.button,
        author: '',
      },
    ],
  }, ''),

  // Browse all CTA — teal accent band
  block('static_banner', {
    background_color: BRAND.bg,
    headline: '瀏覽我們的最新產品',
    headline_font_family: BRAND.font,
    headline_color: BRAND.accent,
    headline_text_align: 'center',
    subheadline: '八種天然活性成分，納米科技釋放功效',
    subheadline_font_family: BRAND.font,
    subheadline_color: '#ffffff',
    subheadline_text_align: 'center',
    cta_text: '購買產品',
    cta_url: '/collections/all',
  }, '瀏覽產品 CTA'),
]

// ────────────────────────────────────────────────────────────────
// PAGE 2: 生產工藝 — /pages/our-company
// ────────────────────────────────────────────────────────────────
const ourCompanyBlocks = [
  block('static_banner', {
    background_url: img('//www.xynargy.hk/cdn/shop/files/Intro_Banner1.png?v=1725439307&width=3840'),
    background_type: 'image',
    headline: '生產工藝',
    headline_color: '#ffffff',
    headline_text_align: 'center',
    subheadline: '國際認證的化妝品生產標準',
    subheadline_color: '#ffffff',
    subheadline_text_align: 'center',
  }, '生產工藝 Hero'),

  block('split', {
    layout: 'image-right',
    image_url: img('//www.xynargy.hk/cdn/shop/files/factory1.png?v=1724835616&width=1500'),
    headline: 'GMP 生產質量',
    content: '我們的工廠遵守最新全球 GMP 化妝品監管，確保質量，提供最安全且最有效的產品。',
  }, 'GMP'),

  block('split', {
    layout: 'image-left',
    image_url: img('//www.xynargy.hk/cdn/shop/files/Screenshot_2024-08-30_233113.png?v=1725032448&width=1500'),
    headline: 'ISO 生產設施',
    content: '我們的生產設施採用最先進的技術和設備，符合 ISO 14644-1 化妝品級認證和指標。',
  }, 'ISO'),
]

// ────────────────────────────────────────────────────────────────
// PAGE 3: 納米科技 — /pages/tech
// ────────────────────────────────────────────────────────────────
const techBlocks = [
  block('static_banner', {
    background_url: img('//www.xynargy.hk/cdn/shop/files/Nano2.jpg?v=1725026997&width=1500'),
    background_type: 'image',
    headline: 'Bio-lipid Polymer Encapsulation',
    headline_color: '#ffffff',
    headline_text_align: 'center',
    subheadline: '脂質聚合物包裹保護 — 納米包裹技術',
    subheadline_color: '#ffffff',
    subheadline_text_align: 'center',
  }, '納米科技 Hero'),

  block('split', {
    layout: 'image-right',
    image_url: img('//www.xynargy.hk/cdn/shop/files/Nano3_d1bc24fa-4a9d-42a3-819f-89576b0bbde9.jpg?v=1725447302&width=1500'),
    headline: '嶄新的納米包裹技術',
    content: '合併兩種納米膠囊物質，包括脂質顆粒和生物聚合物顆粒，把活性成分膠囊化，賦予活性成分穩定性，保護它們免受配方或環境反應降低效能。',
  }, '技術描述'),

  block('text_image_grid', {
    heading: '核心優勢',
    overall_layout: 'horizontal',
    steps: [
      {
        background_url: '',
        background_type: 'image',
        subheadline: '10x Deeper Penetration 深度穿透',
        text_content: '納米顆粒活性物質可以 10 倍更深入地滲透到真皮層中。',
        text_position: 'below',
      },
      {
        background_url: '',
        background_type: 'image',
        subheadline: '5x Prolonged Release 延長釋放',
        text_content: '通過特定觸發因素控制活性物質的釋放，延長原材料的效果並增強功效。',
        text_position: 'below',
      },
    ],
  }, '納米優勢'),
]

// ────────────────────────────────────────────────────────────────
// PAGE 4: 產品研發 — /pages/research
// ────────────────────────────────────────────────────────────────
const researchBlocks = [
  block('static_banner', {
    background_color: '#0f766e',
    headline: '產品研發',
    headline_color: '#ffffff',
    headline_text_align: 'center',
    subheadline: '多年研究，精選八種天然乳房健康成分',
    subheadline_color: '#ffffff',
    subheadline_text_align: 'center',
  }, '研發 Hero'),

  block('split', {
    layout: 'image-right',
    image_url: img('//www.xynargy.hk/cdn/shop/files/preview_images/067462f079344dc7bc4669eabdf6e844.thumbnail.0000000000.jpg?v=1725435008&width=3840'),
    headline: '研究成果',
    content: '我們的研究團隊經過多年努力，收集了各種對乳房健康有益的原料。研究文獻記載這些原料可以抑制組織纖維化、增加血液循環、改善新陳代謝、促進排水排毒、減少局部腫脹、減少癌細胞生長及腫瘤累積。',
  }, '研究成果'),

  block('text_image_grid', {
    heading: '成分功效',
    overall_layout: 'horizontal',
    steps: [
      { subheadline: '靈芝', text_content: '靈芝多醣能清除體內自由基，有解毒、抗菌、抗腫瘤等作用。', text_position: 'below' },
      { subheadline: '韓國紅參', text_content: '韓國紅參皂甙可減少癌細胞生長，降低腫瘤及腫塊累積數量。', text_position: 'below' },
      { subheadline: '薑黃素', text_content: '從薑黃植物中提取的多酚，具抗纖維化、鎮痛和抗炎活性。', text_position: 'below' },
      { subheadline: '澳洲茶樹', text_content: '含抗微生物和消炎的天然活性成分4-松油醇，具抗腫瘤功效。', text_position: 'below' },
      { subheadline: '瑞士葡萄籽', text_content: '已被證明可抑制各種惡性細胞的增殖。', text_position: 'below' },
      { subheadline: '綠茶', text_content: '改善血液微循環，活化皮膚細胞，增加再生速度。', text_position: 'below' },
      { subheadline: '咖啡因', text_content: '能減少脂肪團生成，抑制組織纖維化。', text_position: 'below' },
      { subheadline: '亞麻籽', text_content: '脂肪酸有助於調理、收緊、緊實和豐盈肌膚。', text_position: 'below' },
    ],
  }, '八種成分'),
]

// ────────────────────────────────────────────────────────────────
// PAGE 5: 產品安全 — /pages/safety
// ────────────────────────────────────────────────────────────────
const safetyBlocks = [
  block('static_banner', {
    background_url: img('//www.xynargy.hk/cdn/shop/files/Screenshot_2024-08-30_232836_e406a000-f4d6-4cdd-bfa5-e1991ccd820d.png?v=1725454274&width=3840'),
    background_type: 'image',
    headline: '產品安全 (FDA)',
    headline_color: '#ffffff',
    headline_text_align: 'center',
    subheadline: 'FDA 註冊產品，成分選自 FDA、歐盟成分資料庫，經合格專家認可為安全產品',
    subheadline_color: '#ffffff',
    subheadline_text_align: 'center',
  }, '安全 Hero'),

  block('text_image_grid', {
    heading: '三大安全保障',
    overall_layout: 'horizontal',
    steps: [
      { subheadline: '無添加', text_content: '不含酒精、著色劑、化學防腐劑、合成香料。', text_position: 'below' },
      { subheadline: '天然成份', text_content: '所有原材料均來自美國、歐洲和韓國的天然來源，並具有 COA、MSDS、EcoCert 等安全證書。', text_position: 'below' },
      { subheadline: '臨床證明', text_content: '我們的成分經過體內和體外測試的臨床驗證，並附有書面聲明其效力。', text_position: 'below' },
    ],
  }, '三大保障'),
]

// ────────────────────────────────────────────────────────────────
// PAGE 6: 成功案例 — /pages/case-studies
// ────────────────────────────────────────────────────────────────
const caseBlocks = [
  block('static_banner', {
    background_color: '#1e3a8a',
    headline: '成功案例',
    headline_color: '#ffffff',
    headline_text_align: 'center',
    subheadline: '真實客戶見證 — 乳腺健康改善案例',
    subheadline_color: '#ffffff',
    subheadline_text_align: 'center',
  }, '案例 Hero'),

  block('testimonials', {
    heading: '客戶案例分析',
    autoplay: false,
    testimonials: [
      { name: '張女士', age: '50', location: '乳腺增生', rating: 5, benefits: ['開始使用：2023/11/30'], content: '通過3個月的不斷使用，於24年2月尾再做彩超檢測，終於發現乳腺回復正常。' },
      { name: '楊小姐', age: '40', location: '乳房脹痛', rating: 5, benefits: ['開始使用：2023/11/4'], content: '大概十天時間，發覺結節不見了，乳房也變得比較柔軟。' },
      { name: '雷太', age: '38', location: '乳房脹痛', rating: 5, benefits: ['開始使用：2024/2/17'], content: '到2月7號，所有結節不見了。感覺很見效。' },
      { name: '彭小姐', age: '42', location: '乳腺結節', rating: 5, benefits: ['開始使用：2023/10/20'], content: '大概20天時間，發覺結節不見了。' },
      { name: '舒小姐', age: '44', location: '乳腺結節', rating: 5, benefits: ['開始使用：2024/1/27'], content: '到2月7號，所有結節不見了，感覺很見效。' },
      { name: '王先生', age: '38', location: '纖維瘤', rating: 5, benefits: ['開始使用：2024/2/1'], content: '不到一個月這個纖維瘤已經變細變軟。' },
      { name: '何女士', age: '88', location: '靜脈曲張', rating: 5, benefits: ['開始使用：2024/3/13'], content: '過了一個月後，靜脈曲張確實好轉了。' },
      { name: '林先生', age: '72', location: '靜脈曲張', rating: 5, benefits: ['開始使用：2024/4/10'], content: '大概7天左右，發覺靜脈曲張明顯好轉了。' },
    ],
  }, '客戶案例'),
]

// ────────────────────────────────────────────────────────────────
// PAGE 7: 聯系我們 — /pages/contact
// ────────────────────────────────────────────────────────────────
const contactBlocks = [
  block('static_banner', {
    background_color: '#111827',
    headline: '聯繫我們',
    headline_color: '#ffffff',
    headline_text_align: 'center',
    subheadline: '我們樂意為您服務',
    subheadline_color: '#e5e7eb',
    subheadline_text_align: 'center',
  }, '聯繫 Hero'),

  block('split', {
    layout: 'image-right',
    image_url: '',
    headline: '辦公室地址',
    content: '香港辦公室：香港九龍觀塘敬業街49號建生商業中心10樓\n電郵：xynargyhk@gmail.com\n\n美國辦公室：55 Lake St., STE 2-27-37, Nashua, NH 03060 US\n電郵：info@xynargy.com',
  }, '地址'),

  block('form', {
    headline: '聯絡我們',
    subheadline: '留下您的訊息，我們會盡快回覆',
    fields: [
      { label: '名稱', type: 'text', required: true, placeholder: '請輸入您的姓名' },
      { label: '電子郵件', type: 'email', required: true, placeholder: '請輸入您的電子郵件' },
      { label: '電話號碼', type: 'text', required: false, placeholder: '請輸入您的電話' },
      { label: '留言', type: 'textarea', required: true, placeholder: '請輸入您的留言' },
    ],
    cta_text: '傳送',
  }, '聯絡表格'),
]

// ────────────────────────────────────────────────────────────────
// PAGE 8: 獎勵計劃 — /pages/rewards
// ────────────────────────────────────────────────────────────────
const rewardsBlocks = [
  block('static_banner', {
    background_color: '#7c3aed',
    headline: 'Join Our Rewards Program',
    headline_color: '#ffffff',
    headline_text_align: 'center',
    subheadline: '獎勵計劃 — 成為我們的品牌大使',
    subheadline_color: '#ffffff',
    subheadline_text_align: 'center',
  }, '獎勵 Hero'),

  block('split', {
    layout: 'image-right',
    image_url: '',
    headline: '分享品牌，賺取回報',
    content: '我們知道您喜歡我們銷售的產品，那麼為什麼不透過分享我們的品牌來獲得報酬呢？我們積極尋找充滿熱情的人才來幫助推廣我們的產品，作為回報，我們提供極其慷慨的獎勵計劃，提供卓越、持續且有吸引力的額外收入來源。我們將提供您自己的軟件，該軟件可追蹤您應得的每筆銷售線索、銷售和佣金付款。',
    cta_text: '立即登記',
    cta_url: '#signup',
  }, '計劃描述'),

  block('static_banner', {
    background_color: '#f3f4f6',
    headline: '在下面登記即可成為我們出色的品牌大使',
    headline_color: '#111827',
    headline_text_align: 'center',
    cta_text: '立即登記',
    cta_url: '#signup',
  }, '登記 CTA'),
]

// ────────────────────────────────────────────────────────────────
// Dispatch
// ────────────────────────────────────────────────────────────────
const pages = [
  { slug: null, name: '首頁', blocks: homeBlocks, hero_headline: 'Xynargy', homeOnly: true },
  { slug: 'our-company', name: '生產工藝', blocks: ourCompanyBlocks, hero_headline: '生產工藝' },
  { slug: 'tech', name: '納米科技', blocks: techBlocks, hero_headline: '納米科技' },
  { slug: 'research', name: '產品研發', blocks: researchBlocks, hero_headline: '產品研發' },
  { slug: 'safety', name: '產品安全', blocks: safetyBlocks, hero_headline: '產品安全' },
  { slug: 'case-studies', name: '成功案例', blocks: caseBlocks, hero_headline: '成功案例' },
  { slug: 'contact', name: '聯系我們', blocks: contactBlocks, hero_headline: '聯繫我們' },
  { slug: 'rewards', name: '獎勵計劃', blocks: rewardsBlocks, hero_headline: '獎勵計劃' },
]

// Apply Xynargy brand palette to any block that has color/font fields.
// Leaves existing explicit values alone for the video block and such.
function applyBrand(b) {
  const d = { ...b.data }
  // Background
  if ('background_color' in d && (d.background_color === '#ffffff' || d.background_color === '#1e293b' || !d.background_color)) {
    d.background_color = BRAND.bg
  }
  // Text/heading colors where present
  const textFields = ['headline_color', 'heading_color', 'content_color', 'text_color', 'subheadline_color']
  for (const f of textFields) {
    if (f in d) d[f] = d[f] === '#ffffff' ? BRAND.bg : (f === 'headline_color' || f === 'heading_color' ? BRAND.heading : BRAND.text)
  }
  // Fonts
  const fontFields = ['headline_font_family', 'heading_font_family', 'subheadline_font_family', 'content_font_family', 'body_font_family', 'text_font_family']
  for (const f of fontFields) if (f in d || f.includes('headline')) d[f] = BRAND.font
  // Button CTA
  if (b.type === 'static_banner' || b.type === 'split' || b.type === 'pricing') {
    d.cta_bg_color = BRAND.button
    d.cta_text_color = BRAND.button_text
  }
  return { ...b, data: d }
}

// Xynargy's real menu (scraped from xynargy.hk nav)
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

async function upsertPage(p) {
  const payload = {
    businessUnitId: BU,
    country: COUNTRY,
    language_code: LANG,
    slug: p.slug,
    is_active: true,
    hero_type: 'carousel',
    hero_headline: p.hero_headline,
    hero_slides: [],
    announcements: [],
    blocks: p.blocks.map((b, i) => ({ ...applyBrand(b), order: i })),
    menu_items: MENU_ITEMS,
    // nav colors are stored on business_units.global_navigation (see scripts/set-xynargy-nav.mjs)
    footer: {},
  }
  const res = await fetch(`${API}/api/landing-page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`❌ ${p.slug ?? '(home)'} — ${res.status}: ${text.slice(0, 300)}`)
    return false
  }
  console.log(`✅ ${p.slug ?? '(home)'} — ${p.name} — ${p.blocks.length} blocks`)
  return true
}

(async () => {
  const onlyHome = process.argv.includes('--home-only')
  const todo = onlyHome ? pages.filter(p => p.homeOnly) : pages
  console.log(`\nCloning xynargy.hk → BU=${BU} ${COUNTRY}/${LANG} ${onlyHome ? '(HOME ONLY)' : ''}\n`)
  let ok = 0
  for (const p of todo) {
    if (await upsertPage(p)) ok++
  }
  console.log(`\nDone: ${ok}/${todo.length} pages published.\n`)
})()
