/**
 * Generate Embeddings for Existing Data
 * Run this script to add embeddings to all existing knowledge, guidelines, and training data
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { generateKnowledgeEmbedding, generateGuidelineEmbedding, generateTrainingEmbedding } from '../lib/embeddings'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // skincoach UUID

async function generateKnowledgeEmbeddings() {
  console.log('\n📚 Generating embeddings for knowledge base...')

  // Get all knowledge entries without embeddings
  const { data: entries, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .is('embedding', null)

  if (error) {
    console.error('Error loading knowledge entries:', error)
    return
  }

  if (!entries || entries.length === 0) {
    console.log('✅ All knowledge entries already have embeddings!')
    return
  }

  console.log(`Found ${entries.length} entries without embeddings`)

  let successCount = 0
  let errorCount = 0

  for (const entry of entries) {
    try {
      console.log(`Processing: ${entry.topic || entry.id}...`)

      // Generate embedding
      const embedding = await generateKnowledgeEmbedding({
        topic: entry.topic,
        content: entry.content,
        category: entry.category
      })

      // Update entry with embedding
      const { error: updateError } = await supabase
        .from('knowledge_base')
        .update({
          embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (updateError) {
        console.error(`❌ Error updating ${entry.id}:`, updateError)
        errorCount++
      } else {
        console.log(`✅ Embedded: ${entry.topic}`)
        successCount++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`❌ Error processing ${entry.id}:`, error)
      errorCount++
    }
  }

  console.log(`\n📊 Knowledge Base Results:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

async function generateGuidelinesEmbeddings() {
  console.log('\n📋 Generating embeddings for guidelines...')

  const { data: guidelines, error } = await supabase
    .from('guidelines')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .is('embedding', null)

  if (error) {
    console.error('Error loading guidelines:', error)
    return
  }

  if (!guidelines || guidelines.length === 0) {
    console.log('✅ All guidelines already have embeddings!')
    return
  }

  console.log(`Found ${guidelines.length} guidelines without embeddings`)

  let successCount = 0
  let errorCount = 0

  for (const guideline of guidelines) {
    try {
      console.log(`Processing: ${guideline.title}...`)

      const embedding = await generateGuidelineEmbedding({
        title: guideline.title,
        content: guideline.content,
        category: guideline.category
      })

      const { error: updateError } = await supabase
        .from('guidelines')
        .update({
          embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', guideline.id)

      if (updateError) {
        console.error(`❌ Error updating ${guideline.id}:`, updateError)
        errorCount++
      } else {
        console.log(`✅ Embedded: ${guideline.title}`)
        successCount++
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`❌ Error processing ${guideline.id}:`, error)
      errorCount++
    }
  }

  console.log(`\n📊 Guidelines Results:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

async function generateTrainingEmbeddings() {
  console.log('\n🎓 Generating embeddings for training data...')

  const { data: trainingData, error } = await supabase
    .from('training_data')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .is('embedding', null)

  if (error) {
    console.error('Error loading training data:', error)
    return
  }

  if (!trainingData || trainingData.length === 0) {
    console.log('✅ All training data already has embeddings!')
    return
  }

  console.log(`Found ${trainingData.length} training entries without embeddings`)

  let successCount = 0
  let errorCount = 0

  for (const training of trainingData) {
    try {
      console.log(`Processing: ${training.question?.substring(0, 50)}...`)

      const embedding = await generateTrainingEmbedding({
        question: training.question,
        answer: training.answer,
        category: training.category
      })

      const { error: updateError } = await supabase
        .from('training_data')
        .update({
          embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', training.id)

      if (updateError) {
        console.error(`❌ Error updating ${training.id}:`, updateError)
        errorCount++
      } else {
        console.log(`✅ Embedded: ${training.question?.substring(0, 50)}`)
        successCount++
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`❌ Error processing ${training.id}:`, error)
      errorCount++
    }
  }

  console.log(`\n📊 Training Data Results:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

async function main() {
  console.log('🚀 Starting embedding generation...')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  console.log(`🏢 Business Unit: skincoach (${BUSINESS_UNIT_ID})`)

  try {
    await generateKnowledgeEmbeddings()
    await generateGuidelinesEmbeddings()
    await generateTrainingEmbeddings()

    console.log('\n✅ ✅ ✅ Embedding generation completed! ✅ ✅ ✅')
    console.log('\nNext steps:')
    console.log('1. Test vector search in the application')
    console.log('2. Compare results with old keyword matching')
    console.log('3. Monitor embedding costs in OpenAI dashboard')
  } catch (error) {
    console.error('❌ Embedding generation failed:', error)
    process.exit(1)
  }
}

main()
