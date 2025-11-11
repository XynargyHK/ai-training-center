/**
 * Embedding Migration Script
 *
 * This script generates embeddings for all existing data in your database.
 * Run this ONCE after running SQL migration 005.
 *
 * Usage:
 *   npx tsx scripts/generate-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../src/lib/embeddings'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Stats {
  total: number
  success: number
  skipped: number
  failed: number
}

async function generateEmbeddingsForKnowledgeBase(): Promise<Stats> {
  console.log('\n📚 Processing Knowledge Base...')
  const stats: Stats = { total: 0, success: 0, skipped: 0, failed: 0 }

  const { data: entries, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch knowledge base:', error)
    return stats
  }

  stats.total = entries?.length || 0
  console.log(`Found ${stats.total} knowledge base entries`)

  for (const entry of entries || []) {
    try {
      // Skip if already has embedding
      if (entry.embedding && entry.embedding.length > 0) {
        console.log(`⏭️  Skipping "${entry.topic}" (already has embedding)`)
        stats.skipped++
        continue
      }

      // Generate embedding
      const text = `${entry.topic} ${entry.content}`
      console.log(`🔄 Generating embedding for: "${entry.topic}"`)
      const embedding = await generateEmbedding(text)

      // Update database
      const { error: updateError } = await supabase
        .from('knowledge_base')
        .update({
          embedding: embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (updateError) {
        console.error(`❌ Failed to update "${entry.topic}":`, updateError)
        stats.failed++
      } else {
        console.log(`✅ Updated "${entry.topic}"`)
        stats.success++
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`❌ Error processing "${entry.topic}":`, error)
      stats.failed++
    }
  }

  return stats
}

async function generateEmbeddingsForFAQs(): Promise<Stats> {
  console.log('\n❓ Processing FAQs...')
  const stats: Stats = { total: 0, success: 0, skipped: 0, failed: 0 }

  const { data: entries, error } = await supabase
    .from('faq_library')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch FAQs:', error)
    return stats
  }

  stats.total = entries?.length || 0
  console.log(`Found ${stats.total} FAQ entries`)

  for (const entry of entries || []) {
    try {
      // Skip if already has embedding
      if (entry.embedding && entry.embedding.length > 0) {
        console.log(`⏭️  Skipping "${entry.question}" (already has embedding)`)
        stats.skipped++
        continue
      }

      // Generate embedding
      const text = `${entry.question} ${entry.answer}`
      console.log(`🔄 Generating embedding for: "${entry.question}"`)
      const embedding = await generateEmbedding(text)

      // Update database
      const { error: updateError } = await supabase
        .from('faq_library')
        .update({
          embedding: embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (updateError) {
        console.error(`❌ Failed to update "${entry.question}":`, updateError)
        stats.failed++
      } else {
        console.log(`✅ Updated "${entry.question}"`)
        stats.success++
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`❌ Error processing "${entry.question}":`, error)
      stats.failed++
    }
  }

  return stats
}

async function generateEmbeddingsForCannedMessages(): Promise<Stats> {
  console.log('\n💬 Processing Canned Messages...')
  const stats: Stats = { total: 0, success: 0, skipped: 0, failed: 0 }

  const { data: entries, error } = await supabase
    .from('canned_messages')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch canned messages:', error)
    return stats
  }

  stats.total = entries?.length || 0
  console.log(`Found ${stats.total} canned message entries`)

  for (const entry of entries || []) {
    try {
      // Skip if already has embedding
      if (entry.embedding && entry.embedding.length > 0) {
        console.log(`⏭️  Skipping "${entry.title}" (already has embedding)`)
        stats.skipped++
        continue
      }

      // Generate embedding
      const text = `${entry.title} ${entry.message}`
      console.log(`🔄 Generating embedding for: "${entry.title}"`)
      const embedding = await generateEmbedding(text)

      // Update database
      const { error: updateError } = await supabase
        .from('canned_messages')
        .update({
          embedding: embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (updateError) {
        console.error(`❌ Failed to update "${entry.title}":`, updateError)
        stats.failed++
      } else {
        console.log(`✅ Updated "${entry.title}"`)
        stats.success++
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`❌ Error processing "${entry.title}":`, error)
      stats.failed++
    }
  }

  return stats
}

async function generateEmbeddingsForGuidelines(): Promise<Stats> {
  console.log('\n📋 Processing Guidelines...')
  const stats: Stats = { total: 0, success: 0, skipped: 0, failed: 0 }

  const { data: entries, error } = await supabase
    .from('guidelines')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch guidelines:', error)
    return stats
  }

  stats.total = entries?.length || 0
  console.log(`Found ${stats.total} guideline entries`)

  for (const entry of entries || []) {
    try {
      // Skip if already has embedding
      if (entry.embedding && entry.embedding.length > 0) {
        console.log(`⏭️  Skipping "${entry.title}" (already has embedding)`)
        stats.skipped++
        continue
      }

      // Generate embedding
      const text = `${entry.title} ${entry.content}`
      console.log(`🔄 Generating embedding for: "${entry.title}"`)
      const embedding = await generateEmbedding(text)

      // Update database
      const { error: updateError } = await supabase
        .from('guidelines')
        .update({
          embedding: embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (updateError) {
        console.error(`❌ Failed to update "${entry.title}":`, updateError)
        stats.failed++
      } else {
        console.log(`✅ Updated "${entry.title}"`)
        stats.success++
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`❌ Error processing "${entry.title}":`, error)
      stats.failed++
    }
  }

  return stats
}

async function generateEmbeddingsForTrainingData(): Promise<Stats> {
  console.log('\n🎓 Processing Training Data...')
  const stats: Stats = { total: 0, success: 0, skipped: 0, failed: 0 }

  const { data: entries, error } = await supabase
    .from('training_data')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch training data:', error)
    return stats
  }

  stats.total = entries?.length || 0
  console.log(`Found ${stats.total} training data entries`)

  for (const entry of entries || []) {
    try {
      // Skip if already has embedding
      if (entry.embedding && entry.embedding.length > 0) {
        console.log(`⏭️  Skipping "${entry.question}" (already has embedding)`)
        stats.skipped++
        continue
      }

      // Generate embedding
      const text = `${entry.question} ${entry.answer}`
      console.log(`🔄 Generating embedding for: "${entry.question}"`)
      const embedding = await generateEmbedding(text)

      // Update database
      const { error: updateError } = await supabase
        .from('training_data')
        .update({
          embedding: embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (updateError) {
        console.error(`❌ Failed to update "${entry.question}":`, updateError)
        stats.failed++
      } else {
        console.log(`✅ Updated "${entry.question}"`)
        stats.success++
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`❌ Error processing "${entry.question}":`, error)
      stats.failed++
    }
  }

  return stats
}

async function main() {
  console.log('🚀 Starting Embedding Migration...')
  console.log('This will generate embeddings for all existing data.')
  console.log('Press Ctrl+C to cancel within 3 seconds...\n')

  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 3000))

  const startTime = Date.now()

  // Process all tables
  const kbStats = await generateEmbeddingsForKnowledgeBase()
  const faqStats = await generateEmbeddingsForFAQs()
  const cannedStats = await generateEmbeddingsForCannedMessages()
  const guidelineStats = await generateEmbeddingsForGuidelines()
  const trainingStats = await generateEmbeddingsForTrainingData()

  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))

  const printStats = (name: string, stats: Stats) => {
    console.log(`\n${name}:`)
    console.log(`  Total: ${stats.total}`)
    console.log(`  ✅ Success: ${stats.success}`)
    console.log(`  ⏭️  Skipped: ${stats.skipped}`)
    console.log(`  ❌ Failed: ${stats.failed}`)
  }

  printStats('Knowledge Base', kbStats)
  printStats('FAQs', faqStats)
  printStats('Canned Messages', cannedStats)
  printStats('Guidelines', guidelineStats)
  printStats('Training Data', trainingStats)

  const totalProcessed =
    kbStats.success + faqStats.success + cannedStats.success +
    guidelineStats.success + trainingStats.success
  const totalSkipped =
    kbStats.skipped + faqStats.skipped + cannedStats.skipped +
    guidelineStats.skipped + trainingStats.skipped
  const totalFailed =
    kbStats.failed + faqStats.failed + cannedStats.failed +
    guidelineStats.failed + trainingStats.failed

  console.log('\n' + '='.repeat(60))
  console.log(`🎉 TOTAL: ${totalProcessed} embeddings generated`)
  console.log(`⏭️  SKIPPED: ${totalSkipped} (already had embeddings)`)
  console.log(`❌ FAILED: ${totalFailed}`)
  console.log(`⏱️  Time taken: ${duration} seconds`)
  console.log('='.repeat(60))

  if (totalFailed > 0) {
    console.log('\n⚠️  Some entries failed. Check the logs above for details.')
    process.exit(1)
  } else {
    console.log('\n✅ All embeddings generated successfully!')
    console.log('Your Live Chat now has full smart search capabilities! 🚀')
    process.exit(0)
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
