#!/usr/bin/env node

/**
 * Auto-translate all English FAQs to Chinese (Simplified and Traditional)
 */

const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk').default

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anthropicKey = process.env.ANTHROPIC_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

if (!anthropicKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY environment variable!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const anthropic = new Anthropic({ apiKey: anthropicKey })

async function translateText(text, targetLanguage) {
  const languageMap = {
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese'
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: `Translate the following text to ${languageMap[targetLanguage]}. Maintain professional and helpful tone. Only return the translation, no explanation:\n\n${text}`
    }]
  })

  return message.content[0].type === 'text' ? message.content[0].text : text
}

async function translateAllFAQs() {
  console.log('\n🌍 Starting FAQ Translation Process...\n')

  // 1. Get all English FAQs
  const { data: englishFAQs, error: loadError } = await supabase
    .from('faq_library')
    .select('*')
    .eq('language', 'en')
    .order('created_at', { ascending: false })

  if (loadError) {
    console.error('❌ Error loading FAQs:', loadError.message)
    return
  }

  if (!englishFAQs || englishFAQs.length === 0) {
    console.log('⚠️  No English FAQs found to translate')
    return
  }

  console.log(`✅ Found ${englishFAQs.length} English FAQs to translate\n`)

  const targetLanguages = ['zh-CN', 'zh-TW']
  let totalTranslated = 0

  for (const faq of englishFAQs) {
    console.log(`\n📝 Translating FAQ: "${faq.question.substring(0, 60)}..."`)

    for (const targetLang of targetLanguages) {
      // Check if translation already exists
      const { data: existing } = await supabase
        .from('faq_library')
        .select('id')
        .eq('reference_id', faq.reference_id)
        .eq('language', targetLang)
        .single()

      if (existing) {
        console.log(`   ⏭️  ${targetLang} translation already exists, skipping`)
        continue
      }

      try {
        console.log(`   🔄 Translating to ${targetLang}...`)

        // Translate question and answer
        const translatedQuestion = await translateText(faq.question, targetLang)
        const translatedAnswer = await translateText(faq.answer, targetLang)
        const translatedShortAnswer = faq.short_answer ? await translateText(faq.short_answer, targetLang) : null

        // Generate embedding for translated content
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: translatedQuestion + ' ' + translatedAnswer
          })
        })

        const embeddingData = await embeddingResponse.json()
        const embedding = embeddingData.data[0].embedding

        // Insert translated FAQ
        const { error: insertError } = await supabase
          .from('faq_library')
          .insert({
            business_unit_id: faq.business_unit_id,
            reference_id: faq.reference_id,
            language: targetLang,
            question: translatedQuestion,
            answer: translatedAnswer,
            short_answer: translatedShortAnswer,
            keywords: faq.keywords,
            category: faq.category,
            priority: faq.priority,
            is_published: faq.is_published,
            category_id: faq.category_id,
            embedding: embedding,
            embedding_model: 'text-embedding-3-small',
            embedded_at: new Date().toISOString()
          })

        if (insertError) {
          console.error(`   ❌ Error inserting ${targetLang} translation:`, insertError.message)
        } else {
          console.log(`   ✅ ${targetLang} translation created successfully`)
          totalTranslated++
        }

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`   ❌ Error translating to ${targetLang}:`, error.message)
      }
    }
  }

  console.log(`\n\n${'='.repeat(80)}`)
  console.log('✨ TRANSLATION COMPLETE!')
  console.log('='.repeat(80))
  console.log(`📊 Total translations created: ${totalTranslated}`)
  console.log(`📋 English FAQs processed: ${englishFAQs.length}`)
  console.log(`🌍 Languages: Simplified Chinese (zh-CN), Traditional Chinese (zh-TW)`)
  console.log('\n✅ You can now switch languages in the admin panel to see translated FAQs!\n')
}

translateAllFAQs().catch(console.error)
