const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBlocks() {
  console.log('Checking landing page blocks...\n')

  // Get landing page data
  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('country', 'US')
    .eq('language_code', 'en')

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!pages || pages.length === 0) {
    console.log('No landing page found')
    return
  }

  pages.forEach((page, idx) => {
    console.log(`\n=== Page ${idx + 1} ===`)
    console.log('Hero type:', page.hero_type)
    console.log('Total hero slides:', page.hero_slides?.length || 0)

    // Check blocks
    if (page.blocks && page.blocks.length > 0) {
      console.log(`\nBlocks: ${page.blocks.length} total`)
      page.blocks.slice(0, 5).forEach((block, blockIdx) => {
        console.log(`\nBlock ${blockIdx + 1}:`)
        console.log('  type:', block.type)
        console.log('  order:', block.order)

        if (block.background_url) {
          console.log('  background_url:', block.background_url.substring(0, 60) + '...')
          console.log('  background_type:', block.background_type)
        }

        if (block.image_url) {
          console.log('  image_url:', block.image_url.substring(0, 60) + '...')
        }

        if (block.video_url) {
          console.log('  video_url:', block.video_url.substring(0, 60) + '...')
        }
      })

      if (page.blocks.length > 5) {
        console.log(`\n... and ${page.blocks.length - 5} more blocks`)
      }
    } else {
      console.log('\nNo blocks')
    }
  })
}

checkBlocks()
