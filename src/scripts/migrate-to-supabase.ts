/**
 * Migration Script: Move Guidelines and Training Data from JSON to Supabase
 * Run this once to migrate existing data
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Get business unit ID for skincoach
const BUSINESS_UNIT_ID = 'c4b8f6d2-3e1a-4b9c-8d7e-2f5a6b9c1d3e' // skincoach UUID

async function migrateGuidelines() {
  console.log('\n📋 Migrating Guidelines...')

  const filePath = path.join(process.cwd(), 'data', 'business-units', 'skincoach', 'guidelines.json')

  if (!fs.existsSync(filePath)) {
    console.log('⚠️  No guidelines.json file found, skipping...')
    return
  }

  const guidelines = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  console.log(`Found ${guidelines.length} guidelines to migrate`)

  for (const guideline of guidelines) {
    const { error } = await supabase
      .from('guidelines')
      .upsert({
        business_unit_id: BUSINESS_UNIT_ID,
        original_id: guideline.id,
        category: guideline.category,
        title: guideline.title,
        content: guideline.content,
        created_at: guideline.createdAt || new Date().toISOString(),
        updated_at: guideline.updatedAt || new Date().toISOString()
      }, {
        onConflict: 'original_id'
      })

    if (error) {
      console.error(`❌ Error migrating guideline ${guideline.id}:`, error)
    } else {
      console.log(`✅ Migrated: ${guideline.title}`)
    }
  }

  console.log('✅ Guidelines migration complete!')
}

async function migrateTrainingData() {
  console.log('\n🎓 Migrating Training Data...')

  const filePath = path.join(process.cwd(), 'data', 'business-units', 'skincoach', 'training.json')

  if (!fs.existsSync(filePath)) {
    console.log('⚠️  No training.json file found, skipping...')
    return
  }

  const trainingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  console.log(`Found ${trainingData.length} training entries to migrate`)

  for (const entry of trainingData) {
    const { error } = await supabase
      .from('training_data')
      .upsert({
        business_unit_id: BUSINESS_UNIT_ID,
        original_id: entry.id,
        question: entry.question,
        answer: entry.answer,
        category: entry.category,
        keywords: entry.keywords || [],
        variations: entry.variations || [],
        tone: entry.tone || 'professional',
        priority: entry.priority || 1,
        active: entry.active !== false, // Default to true if not specified
        created_at: entry.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'original_id'
      })

    if (error) {
      console.error(`❌ Error migrating training entry ${entry.id}:`, error)
    } else {
      console.log(`✅ Migrated: ${entry.question.substring(0, 50)}...`)
    }
  }

  console.log('✅ Training data migration complete!')
}

async function main() {
  console.log('🚀 Starting migration to Supabase...')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  console.log(`🏢 Business Unit: skincoach (${BUSINESS_UNIT_ID})`)

  try {
    await migrateGuidelines()
    await migrateTrainingData()

    console.log('\n✅ ✅ ✅ Migration completed successfully! ✅ ✅ ✅')
    console.log('\nNext steps:')
    console.log('1. Verify data in Supabase dashboard')
    console.log('2. Test the application')
    console.log('3. Remove JSON files after confirming everything works')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
