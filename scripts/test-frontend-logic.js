// Simulate what the frontend does when loading the landing page

const mockLandingData = {
  blocks: [
    {
      id: 'f4177e84-e216-41ad-80c0-68021a790e97',
      type: 'testimonials',
      name: 'New testimonials block'
    },
    {
      id: '77323027-fccf-4ad1-84ef-1c05dd91b719',
      type: 'accordion',
      name: 'FAQ Accordion'
    }
  ]
}

console.log('🧪 FRONTEND LOGIC TEST\n')
console.log('=' .repeat(80))

console.log('\n1️⃣ Landing Page Component Logic')
console.log('-'.repeat(80))

// This is what the code does in page.tsx
const hasBlocks = mockLandingData?.blocks && mockLandingData.blocks.length > 0

console.log('landingData?.blocks exists:', !!mockLandingData?.blocks)
console.log('landingData.blocks.length:', mockLandingData.blocks.length)
console.log('hasBlocks (condition):', hasBlocks)

console.log('\n2️⃣ Rendering Decision')
console.log('-'.repeat(80))

if (hasBlocks) {
  console.log('✅ SHOULD SHOW: <BlockRenderer blocks={...} />')
  console.log('   Number of blocks to render:', mockLandingData.blocks.length)
  mockLandingData.blocks.forEach((block, i) => {
    console.log(`   Block ${i + 1}: ${block.type} - "${block.name}"`)
  })
} else {
  console.log('❌ SHOULD SHOW: Hardcoded fallback content')
  console.log('   This would show old Clinical Results, FAQs, etc.')
}

console.log('\n3️⃣ Check Code Structure')
console.log('-'.repeat(80))
console.log('Reading actual landing page code...\n')

const fs = require('fs')
const path = require('path')

const landingPagePath = path.join(__dirname, '../src/app/livechat/landing/page.tsx')
const landingPageCode = fs.readFileSync(landingPagePath, 'utf8')

// Check if the conditional rendering is correct
const hasConditional = landingPageCode.includes('landingData?.blocks && landingData.blocks.length > 0')
const hasBlockRenderer = landingPageCode.includes('<BlockRenderer blocks=')
const hasFallback = landingPageCode.includes('Clinical Results')

console.log('✅ Has conditional check:', hasConditional)
console.log('✅ Has BlockRenderer:', hasBlockRenderer)
console.log('⚠️  Has fallback content:', hasFallback)

// Check if it's using ternary (?) or AND (&&)
const usesTernary = landingPageCode.match(/landingData\?\.blocks.*?\?/s)
const usesAnd = landingPageCode.match(/landingData\?\.blocks.*?&&/s)

console.log('\nRendering pattern:')
if (usesTernary) {
  console.log('✅ Uses ternary operator (condition ? show : fallback)')
  console.log('   This is CORRECT - shows blocks OR fallback')
} else if (usesAnd) {
  console.log('⚠️  Uses AND operator (condition && show)')
  console.log('   This means: if blocks exist, show them')
  console.log('   Then ALWAYS shows hardcoded content after!')
  console.log('   THIS IS THE BUG!')
}

console.log('\n4️⃣ Search for potential issues')
console.log('-'.repeat(80))

// Count how many sections there are
const sectionsMatch = landingPageCode.match(/<section/g)
const sectionCount = sectionsMatch ? sectionsMatch.length : 0

console.log(`Total <section> elements in code: ${sectionCount}`)
console.log('(If > 2, there are hardcoded sections being rendered)')

// Check if fallback is wrapped properly
const hasClosingFragment = landingPageCode.includes('</>')
console.log('Has closing </> fragment:', hasClosingFragment)

if (!hasClosingFragment) {
  console.log('❌ FOUND THE BUG: Fallback content not wrapped in fragment!')
  console.log('   This means hardcoded content ALWAYS shows')
}

console.log('\n' + '='.repeat(80))
