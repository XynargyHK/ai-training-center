require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function publishPoster() {
  console.log('📤 Publishing poster to live site...\n')

  // Get all pages
  const { data: pages } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')

  for (const page of pages) {
    const { id, hero_slides, published_data, ...restData } = page

    // Update published_data with current hero_slides (which has poster_url)
    const newPublishedData = {
      ...restData,
      ...published_data,
      hero_slides // Use the updated hero_slides with poster_url
    }

    const { error } = await supabase
      .from('landing_pages')
      .update({ published_data: newPublishedData })
      .eq('id', id)

    if (error) {
      console.error(`❌ Failed to update ${id}:`, error.message)
    } else {
      console.log(`✅ Published page ${id.substring(0, 8)}...`)
    }
  }

  console.log('\n✅ DONE! Refresh your page - poster should show now!')
}

publishPoster()
