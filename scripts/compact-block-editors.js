const fs = require('fs')
const path = require('path')

const files = [
  'src/components/admin/landing-page/blocks/PricingBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/StaticBannerBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/TableBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/AccordionBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/StepsBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/TestimonialsBlockEditor.tsx',
  'src/components/admin/landing-page/UniversalTextEditor.tsx',
  'src/components/admin/landing-page/TextEditorControls.tsx',
  'src/components/admin/landing-page/BlockManager.tsx',
]

const replacements = [
  // Spacing: space-y-6 → space-y-3
  ['className="space-y-6"', 'className="space-y-3"'],

  // Section padding: p-4 → p-2
  [/p-4 border border-gray-200/g, 'p-2 border border-gray-200'],
  [/p-4 bg-gray-50/g, 'p-2 bg-gray-50'],

  // Label text: text-sm font-medium → text-xs font-medium
  [/text-sm font-medium text-gray-600/g, 'text-xs font-medium text-gray-600'],
  [/text-sm font-medium text-gray-500/g, 'text-xs font-medium text-gray-500'],

  // Label margin: mb-2" → mb-1"  (only after text-gray-600 or font-medium)
  [/block text-sm font-medium text-gray-600 mb-2/g, 'block text-xs font-medium text-gray-600 mb-1'],
  [/block text-xs font-medium text-gray-600 mb-2/g, 'block text-xs font-medium text-gray-600 mb-1'],

  // Input padding: px-3 py-2 → px-2 py-1.5 (inside inputs/selects)
  [/px-3 py-2 bg-gray-100 border/g, 'px-2 py-1.5 bg-gray-100 border'],
  [/px-3 py-2 bg-white border/g, 'px-2 py-1.5 bg-white border'],

  // Input text: text-sm in form inputs (after rounded-none)
  [/rounded-none text-gray-800 text-sm"/g, 'rounded-none text-gray-800 text-xs"'],
  [/rounded-none text-gray-800 text-sm /g, 'rounded-none text-gray-800 text-xs '],

  // Testimonial list item padding
  [/px-4 py-3 flex items-center justify-between/g, 'px-2 py-1.5 flex items-center justify-between'],

  // Dropdown item padding: py-1.5 → py-1
  [/w-full px-3 py-1.5 text-left text-xs hover/g, 'w-full px-2 py-1 text-left text-xs hover'],

  // Empty state padding
  [/border-dashed border-gray-300 rounded-none p-6/g, 'border-dashed border-gray-300 rounded-none p-4'],

  // Heading mb-3 → mb-2
  [/font-medium text-gray-600 mb-3/g, 'font-medium text-gray-600 mb-2'],

  // Plan container p-4 → p-2
  [/bg-gray-50 rounded-none p-4 border/g, 'bg-gray-50 rounded-none p-2 border'],

  // Table cell padding for table block
  [/mb-4 p-3 bg-gray-50/g, 'mb-3 p-2 bg-gray-50'],
]

let totalReplacements = 0

for (const filePath of files) {
  const fullPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${filePath} (not found)`)
    continue
  }

  let content = fs.readFileSync(fullPath, 'utf-8')
  let fileReplacements = 0

  for (const [search, replace] of replacements) {
    if (typeof search === 'string') {
      const count = content.split(search).length - 1
      if (count > 0) {
        content = content.split(search).join(replace)
        fileReplacements += count
      }
    } else {
      const matches = content.match(search)
      if (matches) {
        content = content.replace(search, replace)
        fileReplacements += matches.length
      }
    }
  }

  if (fileReplacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf-8')
    console.log(`${filePath}: ${fileReplacements} replacements`)
    totalReplacements += fileReplacements
  } else {
    console.log(`${filePath}: no changes`)
  }
}

console.log(`\nTotal: ${totalReplacements} replacements across ${files.length} files`)
