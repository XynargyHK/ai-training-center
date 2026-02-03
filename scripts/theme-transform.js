/**
 * Transform dark theme to light minimal theme
 * Run: node scripts/theme-transform.js
 */
const fs = require('fs')
const path = require('path')
const glob = require('glob')

// All admin component files
const files = [
  'src/components/admin/ai-training-center.tsx',
  'src/components/admin/knowledge-base.tsx',
  'src/components/admin/product-catalog-manager.tsx',
  'src/components/admin/product-form.tsx',
  'src/components/admin/bundle-manager.tsx',
  'src/components/admin/catalog-settings.tsx',
  'src/components/admin/addon-matching-modal.tsx',
  'src/components/admin/roleplay-training.tsx',
  'src/components/admin/landing-page/LanguageBar.tsx',
  'src/components/admin/landing-page/ProductLanguageBar.tsx',
  'src/components/admin/landing-page/BlockPreview.tsx',
  'src/components/admin/landing-page/TextEditorControls.tsx',
  'src/components/admin/landing-page/UniversalTextEditor.tsx',
  'src/components/admin/landing-page/FooterEditor.tsx',
  'src/components/admin/landing-page/PolicyRichTextEditor.tsx',
  'src/components/admin/landing-page/TranslationPanel.tsx',
  'src/components/admin/landing-page/ProductAddLocaleModal.tsx',
  'src/components/admin/landing-page/AddLocaleModal.tsx',
  'src/components/admin/landing-page/BlockContainer.tsx',
  'src/components/admin/landing-page/BlockManager.tsx',
  'src/components/admin/landing-page/BlockPicker.tsx',
  'src/components/admin/landing-page/blocks/CardBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/AccordionBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/TestimonialsBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/SplitBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/StaticBannerBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/TableBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/PricingBlockEditor.tsx',
  'src/components/admin/landing-page/blocks/StepsBlockEditor.tsx',
  'src/components/admin/lead-management.tsx',
  'src/components/admin/profile-modal.tsx',
  'src/components/admin/policy-manager.tsx',
  'src/components/admin/product-template-selector.tsx',
  'src/components/admin/catalog-setup-wizard.tsx',
]

// Replacement rules in order (order matters!)
const replacements = [
  // Phase 1: Dark backgrounds → white/light
  ['bg-slate-900', 'bg-white'],
  ['bg-slate-800/50', 'bg-gray-50'],
  ['bg-slate-800', 'bg-white'],
  ['bg-slate-700/70', 'bg-gray-100'],
  ['bg-slate-700/50', 'bg-gray-50'],
  ['bg-slate-700/30', 'bg-gray-50'],
  ['bg-slate-700', 'bg-gray-100'],
  ['bg-slate-600', 'bg-gray-200'],

  // Phase 2: Text colors
  ['text-white', 'text-gray-800'],
  ['text-slate-200', 'text-gray-700'],
  ['text-slate-300', 'text-gray-600'],
  ['text-slate-400', 'text-gray-500'],
  ['text-slate-500', 'text-gray-400'],
  ['text-slate-600', 'text-gray-400'],

  // Phase 3: Borders
  ['border-slate-700', 'border-gray-200'],
  ['border-slate-600', 'border-gray-200'],
  ['border-slate-500', 'border-gray-300'],

  // Phase 4: Hover dark states
  ['hover:bg-slate-700', 'hover:bg-gray-100'],
  ['hover:bg-slate-600', 'hover:bg-gray-100'],
  ['hover:bg-slate-500', 'hover:bg-gray-100'],

  // Phase 5: Rounded corners → straight
  ['rounded-xl', 'rounded-none'],
  ['rounded-lg', 'rounded-none'],
  // standalone rounded (careful - not rounded-full, rounded-none, rounded-sm)
  // We'll handle this with a regex below

  // Phase 6: Colored bg accents with opacity → light
  ['bg-blue-600/20', 'bg-blue-50'],
  ['bg-blue-600/30', 'bg-blue-50'],
  ['bg-green-600/20', 'bg-green-50'],
  ['bg-green-600/30', 'bg-green-50'],
  ['bg-purple-600/20', 'bg-purple-50'],
  ['bg-purple-600/30', 'bg-purple-50'],
  ['bg-orange-600/20', 'bg-orange-50'],
  ['bg-red-600/20', 'bg-red-50'],
  ['bg-cyan-600/20', 'bg-cyan-50'],
  ['bg-violet-600/30', 'bg-violet-50'],
  ['bg-violet-600/20', 'bg-violet-50'],
  ['bg-yellow-600/20', 'bg-yellow-50'],
  ['bg-pink-500/20', 'bg-pink-50'],
  ['bg-green-500/20', 'bg-green-50'],
  ['bg-blue-500/20', 'bg-blue-50'],
  ['bg-purple-500/20', 'bg-purple-50'],
  ['bg-cyan-500/20', 'bg-cyan-50'],

  // Dark colored bgs → light
  ['bg-blue-900/20', 'bg-blue-50'],
  ['bg-blue-900/30', 'bg-blue-50'],
  ['bg-green-900/30', 'bg-green-50'],
  ['bg-green-900/20', 'bg-green-50'],
  ['bg-purple-900/30', 'bg-purple-50'],
  ['bg-purple-900/20', 'bg-purple-50'],
  ['bg-red-900/30', 'bg-red-50'],
  ['bg-red-900/20', 'bg-red-50'],
  ['bg-orange-900/30', 'bg-orange-50'],
  ['bg-blue-900', 'bg-blue-50'],
  ['bg-green-900', 'bg-green-50'],
  ['bg-purple-900', 'bg-purple-50'],
  ['bg-yellow-900', 'bg-yellow-50'],
  ['bg-orange-900', 'bg-orange-50'],
  ['bg-red-900', 'bg-red-50'],

  // Solid colored bgs → light
  ['bg-blue-600', 'bg-blue-50 border border-blue-200'],
  ['bg-blue-500', 'bg-blue-50'],
  ['bg-green-600', 'bg-green-50 border border-green-200'],
  ['bg-green-500', 'bg-green-50'],
  ['bg-purple-600', 'bg-purple-50 border border-purple-200'],
  ['bg-purple-500', 'bg-purple-50'],
  ['bg-red-600', 'bg-red-50 border border-red-200'],
  ['bg-red-500', 'bg-red-50'],
  ['bg-orange-600', 'bg-orange-50'],
  ['bg-violet-600', 'bg-violet-50 border border-violet-200'],
  ['bg-violet-500', 'bg-violet-50'],
  ['bg-yellow-600', 'bg-yellow-50'],
  ['bg-cyan-600', 'bg-cyan-50'],
  ['bg-amber-600', 'bg-amber-50'],
  ['bg-pink-600', 'bg-pink-50'],

  // Phase 7: Hover colored → light hover
  ['hover:bg-blue-700', 'hover:bg-blue-100'],
  ['hover:bg-blue-500', 'hover:bg-blue-100'],
  ['hover:bg-blue-600', 'hover:bg-blue-100'],
  ['hover:bg-green-700', 'hover:bg-green-100'],
  ['hover:bg-green-500', 'hover:bg-green-100'],
  ['hover:bg-green-600', 'hover:bg-green-100'],
  ['hover:bg-purple-700', 'hover:bg-purple-100'],
  ['hover:bg-purple-500', 'hover:bg-purple-100'],
  ['hover:bg-purple-600', 'hover:bg-purple-100'],
  ['hover:bg-red-600', 'hover:bg-red-100'],
  ['hover:bg-red-600/20', 'hover:bg-red-50'],
  ['hover:bg-red-500', 'hover:bg-red-100'],
  ['hover:bg-violet-700', 'hover:bg-violet-100'],
  ['hover:bg-orange-500', 'hover:bg-orange-100'],

  // Phase 8: Colored text → darker for readability on white
  ['text-blue-400', 'text-blue-600'],
  ['text-blue-300', 'text-blue-600'],
  ['text-green-400', 'text-green-600'],
  ['text-green-300', 'text-green-600'],
  ['text-purple-400', 'text-purple-600'],
  ['text-purple-300', 'text-purple-600'],
  ['text-violet-400', 'text-violet-600'],
  ['text-violet-300', 'text-violet-600'],
  ['text-cyan-400', 'text-cyan-600'],
  ['text-cyan-300', 'text-cyan-600'],
  ['text-orange-400', 'text-orange-600'],
  ['text-orange-300', 'text-orange-600'],
  ['text-red-400', 'text-red-600'],
  ['text-red-300', 'text-red-600'],
  ['text-yellow-400', 'text-yellow-600'],
  ['text-yellow-300', 'text-yellow-600'],
  ['text-amber-400', 'text-amber-600'],
  ['text-amber-300', 'text-amber-600'],
  ['text-pink-400', 'text-pink-600'],
  ['text-pink-300', 'text-pink-600'],
  ['text-emerald-400', 'text-emerald-600'],
  ['text-emerald-300', 'text-emerald-600'],
  ['text-indigo-400', 'text-indigo-600'],
  ['text-indigo-300', 'text-indigo-600'],

  // Phase 9: Hover text adjustments
  ['hover:text-slate-200', 'hover:text-gray-800'],
  ['hover:text-slate-300', 'hover:text-gray-700'],
  ['hover:text-white', 'hover:text-gray-900'],
  ['hover:text-red-400', 'hover:text-red-600'],
  ['hover:text-blue-400', 'hover:text-blue-600'],
  ['hover:text-blue-300', 'hover:text-blue-600'],

  // Phase 10: Gradients → flat light
  ['bg-gradient-to-r from-blue-500 to-cyan-500', 'bg-blue-50 border border-blue-200'],
  ['bg-gradient-to-r from-purple-500 to-pink-500', 'bg-purple-50 border border-purple-200'],
  ['bg-gradient-to-r from-green-500 to-emerald-500', 'bg-green-50 border border-green-200'],
  ['bg-gradient-to-r from-orange-500 to-amber-500', 'bg-orange-50 border border-orange-200'],
  ['bg-gradient-to-r from-red-500 to-pink-500', 'bg-red-50 border border-red-200'],
  ['bg-gradient-to-r from-blue-600 to-purple-600', 'bg-blue-50 border border-blue-200'],
  ['bg-gradient-to-r from-cyan-500 to-blue-500', 'bg-cyan-50 border border-cyan-200'],
  ['bg-gradient-to-r from-violet-500 to-purple-500', 'bg-violet-50 border border-violet-200'],
  ['bg-gradient-to-br from-blue-500 to-cyan-500', 'bg-blue-50 border border-blue-200'],
  ['bg-gradient-to-br from-slate-800 to-slate-900', 'bg-white'],
  ['bg-gradient-to-r from-blue-600 to-cyan-600', 'bg-blue-50 border border-blue-200'],

  // Phase 11: Modal overlays → lighter
  ['bg-black/80', 'bg-black/20'],
  ['bg-black/70', 'bg-black/20'],
  ['bg-black/50', 'bg-black/10'],

  // Phase 12: Placeholder colors
  ['placeholder-slate-400', 'placeholder-gray-400'],
  ['placeholder-slate-500', 'placeholder-gray-400'],

  // Phase 13: Divide colors
  ['divide-slate-700', 'divide-gray-200'],
  ['divide-slate-600', 'divide-gray-200'],

  // Phase 14: Focus/ring
  ['focus:ring-blue-500', 'focus:ring-blue-300'],
  ['focus:ring-purple-500', 'focus:ring-purple-300'],
  ['focus:ring-orange-500', 'focus:ring-orange-300'],

  // Phase 15: Border colors for dashed
  ['border-dashed border-gray-200', 'border-dashed border-gray-300'],

  // Phase 16: Shadow
  ['shadow-lg', 'shadow-sm'],
  ['shadow-xl', 'shadow-sm'],

  // Phase 17: Misc cleanups
  ['bg-gray-200 text-gray-800', 'bg-gray-100 text-gray-700'], // inputs too dark
]

// Regex replacements for standalone 'rounded' (not part of rounded-lg, etc.)
const regexReplacements = [
  // standalone rounded (space/quote boundary)
  [/(?<=\s)rounded(?=\s|")/g, 'rounded-none'],
]

let totalChanges = 0

for (const filePath of files) {
  const fullPath = path.resolve(filePath)
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${filePath} (not found)`)
    continue
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  const original = content
  let fileChanges = 0

  // Apply string replacements
  for (const [from, to] of replacements) {
    const count = content.split(from).length - 1
    if (count > 0) {
      content = content.replaceAll(from, to)
      fileChanges += count
    }
  }

  // Apply regex replacements
  for (const [regex, to] of regexReplacements) {
    const matches = content.match(regex)
    if (matches) {
      content = content.replace(regex, to)
      fileChanges += matches.length
    }
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`OK: ${filePath} (${fileChanges} replacements)`)
    totalChanges += fileChanges
  } else {
    console.log(`NO CHANGE: ${filePath}`)
  }
}

console.log(`\nDone. Total replacements: ${totalChanges}`)
