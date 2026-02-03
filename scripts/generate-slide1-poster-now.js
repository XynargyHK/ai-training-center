require('dotenv').config({ path: '.env.local' })
const puppeteer = require('puppeteer')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function generatePosterNow() {
  console.log('🎬 Generating poster for slide 1...\n')

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // Get ALL landing pages
    const { data: pages } = await supabase
      .from('landing_pages')
      .select('id, hero_slides')
      .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')

    console.log(`📄 Found ${pages.length} landing pages\n`)

    const firstPage = pages[0]
    const slide1 = firstPage.hero_slides[0]
    const videoUrl = slide1.background_url

    console.log('📹 Video URL:', videoUrl)
    console.log('⏳ Extracting frame...')

    // Create HTML page to extract frame
    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <video id="video" crossorigin="anonymous" style="display:none"></video>
          <canvas id="canvas" style="display:none"></canvas>
        </body>
      </html>
    `

    await page.setContent(html)

    // Extract frame
    const posterBase64 = await page.evaluate(async (url) => {
      return new Promise((resolve, reject) => {
        const video = document.getElementById('video')
        const canvas = document.getElementById('canvas')
        const ctx = canvas.getContext('2d')

        video.onloadedmetadata = () => {
          video.currentTime = 0.1
        }

        video.onseeked = async () => {
          const maxWidth = 1280
          const scale = Math.min(1, maxWidth / video.videoWidth)
          canvas.width = video.videoWidth * scale
          canvas.height = video.videoHeight * scale

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Compress to < 50KB
          let quality = 0.8
          let dataUrl = canvas.toDataURL('image/jpeg', quality)

          for (let i = 0; i < 10; i++) {
            const size = Math.round((dataUrl.length * 3) / 4)
            if (size <= 50000 || quality <= 0.1) break
            quality -= 0.1
            dataUrl = canvas.toDataURL('image/jpeg', quality)
          }

          resolve(dataUrl.split(',')[1])
        }

        video.onerror = reject
        video.src = url
      })
    }, videoUrl)

    console.log('✅ Frame extracted')
    console.log('📤 Uploading to Supabase...')

    // Upload to Supabase
    const buffer = Buffer.from(posterBase64, 'base64')
    const filename = `slide1-poster-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`posters/${filename}`, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000'
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(`posters/${filename}`)

    const posterUrl = urlData.publicUrl

    console.log('✅ Uploaded:', posterUrl)
    console.log('💾 Saving to ALL landing pages...')

    // Update ALL landing pages
    for (const page of pages) {
      const updatedSlides = [...page.hero_slides]
      updatedSlides[0] = { ...updatedSlides[0], poster_url: posterUrl }

      const { error: updateError } = await supabase
        .from('landing_pages')
        .update({ hero_slides: updatedSlides })
        .eq('id', page.id)

      if (updateError) {
        console.error(`❌ Failed to update page ${page.id}:`, updateError.message)
      } else {
        console.log(`  ✅ Updated page ${page.id.substring(0, 8)}...`)
      }
    }

    console.log('\n✅ DONE! Poster saved to all pages')
    console.log('📊 File size:', Math.round(buffer.length / 1024), 'KB')
    console.log('\n🎉 Refresh your landing page - slide 1 will load instantly now!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await browser.close()
  }
}

generatePosterNow()
