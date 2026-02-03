const fs = require('fs')
const path = require('path')

console.log('🗺️  COMPREHENSIVE ROUTE ANALYSIS\n')
console.log('='.repeat(80))

// Find all page.tsx files
const appDir = path.join(__dirname, '../src/app')

function findPages(dir, basePath = '') {
  const pages = []
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const relativePath = path.join(basePath, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Skip certain directories
      if (item === 'api' || item.startsWith('.')) continue
      pages.push(...findPages(fullPath, relativePath))
    } else if (item === 'page.tsx' || item === 'page.ts' || item === 'page.jsx' || item === 'page.js') {
      const route = basePath === '' ? '/' : '/' + basePath.replace(/\\/g, '/')
      pages.push({
        route,
        file: path.join(basePath, item).replace(/\\/g, '/'),
        fullPath
      })
    }
  }

  return pages
}

const allPages = findPages(appDir)

console.log('\n1️⃣ ALL PAGE ROUTES IN APPLICATION')
console.log('-'.repeat(80))

allPages.forEach((page, i) => {
  console.log(`${i + 1}. Route: ${page.route}`)
  console.log(`   File: src/app/${page.file}`)

  // Check file size and last modified
  const stats = fs.statSync(page.fullPath)
  const sizeMB = (stats.size / 1024).toFixed(2)
  const modified = stats.mtime.toLocaleDateString()
  console.log(`   Size: ${sizeMB} KB | Modified: ${modified}`)

  // Check for key features in the file
  const content = fs.readFileSync(page.fullPath, 'utf8')

  const features = []
  if (content.includes('BlockRenderer')) features.push('✅ BlockRenderer')
  if (content.includes('blocks && landingData.blocks.length')) features.push('✅ New blocks logic')
  if (content.includes('landingPage.blocks && landingPage.blocks.length')) features.push('✅ New blocks logic')
  if (content.includes('clinical_results')) features.push('⚠️  Old clinical_results')
  if (content.includes('pricing_options')) features.push('⚠️  Old pricing_options')
  if (content.includes('landing_faqs')) features.push('⚠️  Old landing_faqs')
  if (content.includes('CheckoutModal')) features.push('✅ Shopping cart')
  if (content.includes('AICoach')) features.push('✅ Live chat')
  if (content.includes('hero_slides')) features.push('⚠️  Old hero_slides')
  if (content.includes('static_hero')) features.push('⚠️  Old static_hero')

  if (features.length > 0) {
    console.log(`   Features: ${features.join(', ')}`)
  }

  console.log('')
})

console.log('\n2️⃣ LANDING PAGE ROUTES COMPARISON')
console.log('-'.repeat(80))

const landingRoutes = allPages.filter(p =>
  p.route.includes('livechat') ||
  p.route.includes('landing') ||
  p.route.includes('shop') ||
  p.route === '/'
)

landingRoutes.forEach(page => {
  console.log(`\n📄 ${page.route}`)
  console.log('   ' + '-'.repeat(70))

  const content = fs.readFileSync(page.fullPath, 'utf8')

  // Check what this page renders
  console.log('   Rendering pattern:')

  if (content.includes('blocks && landingData.blocks.length > 0 ?')) {
    console.log('   ✅ Uses ternary: shows blocks OR fallback')
  } else if (content.includes('blocks && landingData.blocks.length > 0 &&')) {
    console.log('   ⚠️  Uses AND: shows blocks AND then shows more content')
  } else if (content.includes('landingPage.blocks && landingPage.blocks.length > 0 &&')) {
    console.log('   ⚠️  Uses AND: shows blocks AND then shows more content')
  }

  // Check if it has old hardcoded sections
  const oldSections = [
    'clinical_results',
    'tech_features',
    'pricing_options',
    'landing_faqs',
    'testimonials_stats'
  ]

  const foundOldSections = oldSections.filter(section => content.includes(section))

  if (foundOldSections.length > 0) {
    console.log(`   ⚠️  Has old sections: ${foundOldSections.join(', ')}`)
    console.log('   → This route will show OLD content from database schema')
  }

  // Check if has new features
  if (content.includes('CheckoutModal')) {
    console.log('   ✅ Has shopping cart (CheckoutModal)')
  }

  if (content.includes('AICoach')) {
    console.log('   ✅ Has live chat (AICoach)')
  }

  // Check when last modified
  const stats = fs.statSync(page.fullPath)
  const daysAgo = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
  console.log(`   📅 Last modified: ${daysAgo} days ago`)
})

console.log('\n3️⃣ RAILWAY PREVIEW DIAGNOSIS')
console.log('-'.repeat(80))

console.log('\nWhen you click "Preview" in Railway, it loads:')
console.log('  URL: https://your-app.railway.app/')
console.log('  File: src/app/page.tsx')
console.log('')

const rootPage = allPages.find(p => p.route === '/')
if (rootPage) {
  const content = fs.readFileSync(rootPage.fullPath, 'utf8')

  if (content.includes('AITrainingCenter')) {
    console.log('✅ Root route shows: Admin Interface (AI Training Center)')
    console.log('   This is CORRECT for admin users')
  } else if (content.includes('LiveChatPreview') || content.includes('LandingPage')) {
    console.log('⚠️  Root route shows: Landing Page')
    console.log('   This might be the issue!')
  }
}

console.log('\n4️⃣ EXPECTED ROUTES FOR END USERS')
console.log('-'.repeat(80))
console.log('\nCustomers should access:')
console.log('  /livechat?businessUnit=skincoach   ← Main shop page')
console.log('  /livechat/shop?businessUnit=...     ← Alternative shop page')
console.log('  /livechat/landing?businessUnit=...  ← Pure landing page')
console.log('')
console.log('Admin users should access:')
console.log('  /                                    ← AI Training Center admin')
console.log('')

console.log('\n5️⃣ ROOT CAUSE ANALYSIS')
console.log('='.repeat(80))

const livechatPage = allPages.find(p => p.route === '/livechat')
if (livechatPage) {
  const content = fs.readFileSync(livechatPage.fullPath, 'utf8')

  const hasOld = content.includes('clinical_results') || content.includes('pricing_options')
  const hasNew = content.includes('BlockRenderer')

  console.log('\n/livechat page analysis:')
  console.log(`  Has new blocks system: ${hasNew ? '✅' : '❌'}`)
  console.log(`  Has old sections: ${hasOld ? '⚠️  YES' : '✅ NO'}`)

  if (hasOld && hasNew) {
    console.log('\n❌ ROOT CAUSE FOUND:')
    console.log('   /livechat renders BOTH old schema AND new blocks!')
    console.log('   When blocks exist, it shows them.')
    console.log('   BUT it ALSO shows old sections (clinical_results, etc.)')
    console.log('   from the OLD landing_pages database schema.')
    console.log('')
    console.log('SOLUTION:')
    console.log('   Update /livechat to use ONLY blocks (like /livechat/landing does)')
    console.log('   OR point Railway preview to /livechat/landing instead')
  }
}

console.log('\n' + '='.repeat(80))
