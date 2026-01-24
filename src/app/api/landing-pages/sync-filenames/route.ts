import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to resolve business unit ID from slug
async function resolveBusinessUnitId(idOrSlug: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(idOrSlug)) {
    return idOrSlug
  }

  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', idOrSlug)
    .single()

  return data?.id || null
}

// Sync original_filename from source locale to target locale based on matching URLs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessUnitId: buParam, targetCountry, targetLanguage, sourceCountry = 'US', sourceLanguage = 'en' } = body

    if (!buParam || !targetCountry || !targetLanguage) {
      return NextResponse.json(
        { error: 'businessUnitId, targetCountry, and targetLanguage are required' },
        { status: 400 }
      )
    }

    const businessUnitId = await resolveBusinessUnitId(buParam)
    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Get source landing page
    const { data: sourcePage, error: sourceError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .eq('country', sourceCountry)
      .eq('language_code', sourceLanguage)
      .single()

    if (sourceError || !sourcePage) {
      return NextResponse.json({ error: 'Source locale not found' }, { status: 404 })
    }

    // Get target landing page
    const { data: targetPage, error: targetError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .eq('country', targetCountry)
      .eq('language_code', targetLanguage)
      .single()

    if (targetError || !targetPage) {
      return NextResponse.json({ error: 'Target locale not found' }, { status: 404 })
    }

    // Build URL to filename mapping from source
    const urlToFilename: Record<string, string> = {}

    // From hero slides
    if (sourcePage.hero_slides) {
      sourcePage.hero_slides.forEach((slide: any) => {
        if (slide.background_url && slide.original_filename) {
          urlToFilename[slide.background_url] = slide.original_filename
        }
      })
    }

    // From blocks
    if (sourcePage.blocks) {
      sourcePage.blocks.forEach((block: any) => {
        // Steps block
        if (block.data?.steps) {
          block.data.steps.forEach((step: any) => {
            if (step.background_url && step.original_filename) {
              urlToFilename[step.background_url] = step.original_filename
            }
          })
        }
        // Static banner
        if (block.data?.background_url && block.data?.original_filename) {
          urlToFilename[block.data.background_url] = block.data.original_filename
        }
        // Table block
        if (block.data?.header_image_url && block.data?.original_filename) {
          urlToFilename[block.data.header_image_url] = block.data.original_filename
        }
      })
    }

    console.log(`Found ${Object.keys(urlToFilename).length} URL->filename mappings`)

    // Apply to target
    let syncedCount = 0
    const targetData = { ...targetPage }

    // Sync hero slides
    if (targetData.hero_slides) {
      targetData.hero_slides = targetData.hero_slides.map((slide: any) => {
        if (slide.background_url && !slide.original_filename && urlToFilename[slide.background_url]) {
          syncedCount++
          return { ...slide, original_filename: urlToFilename[slide.background_url] }
        }
        return slide
      })
    }

    // Sync blocks
    if (targetData.blocks) {
      targetData.blocks = targetData.blocks.map((block: any) => {
        const updatedBlock = { ...block, data: { ...block.data } }

        // Steps block
        if (updatedBlock.data?.steps) {
          updatedBlock.data.steps = updatedBlock.data.steps.map((step: any) => {
            if (step.background_url && !step.original_filename && urlToFilename[step.background_url]) {
              syncedCount++
              return { ...step, original_filename: urlToFilename[step.background_url] }
            }
            return step
          })
        }

        // Static banner
        if (updatedBlock.data?.background_url && !updatedBlock.data?.original_filename && urlToFilename[updatedBlock.data.background_url]) {
          syncedCount++
          updatedBlock.data.original_filename = urlToFilename[updatedBlock.data.background_url]
        }

        // Table block
        if (updatedBlock.data?.header_image_url && !updatedBlock.data?.original_filename && urlToFilename[updatedBlock.data.header_image_url]) {
          syncedCount++
          updatedBlock.data.original_filename = urlToFilename[updatedBlock.data.header_image_url]
        }

        return updatedBlock
      })
    }

    // Save updated target
    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({
        hero_slides: targetData.hero_slides,
        blocks: targetData.blocks
      })
      .eq('id', targetPage.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update target locale' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} filenames from ${sourceCountry}/${sourceLanguage} to ${targetCountry}/${targetLanguage}`
    })

  } catch (error) {
    console.error('Sync filenames error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
