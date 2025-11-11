import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * AUTO DATA MIGRATION
 * Automatically migrates any data and creates product entries
 */
export async function POST(request: NextRequest) {
  try {
    const { knowledgeEntries, businessUnitId } = await request.json()

    console.log(`📦 Starting auto-migration for business unit: ${businessUnitId}`)
    console.log(`📊 Entries to migrate: ${knowledgeEntries?.length || 0}`)

    const results = {
      totalReceived: knowledgeEntries?.length || 0,
      migrated: 0,
      skipped: 0,
      errors: []
    }

    // Check if data already exists
    const { count: existingCount } = await supabaseAdmin
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('business_unit_id', businessUnitId)

    console.log(`📋 Existing entries in database: ${existingCount}`)

    if (!knowledgeEntries || knowledgeEntries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No data to migrate',
        results: {
          ...results,
          existingCount
        }
      })
    }

    // Migrate each entry
    for (const entry of knowledgeEntries) {
      try {
        const supabaseEntry = {
          business_unit_id: businessUnitId,
          category: entry.category || 'Product Information',
          topic: entry.topic || 'Product',
          title: entry.topic || entry.fileName || 'Product Entry',
          content: entry.content || '',
          keywords: entry.keywords || [],

          // Dynamic raw_data field - preserves original structure
          raw_data: {
            originalId: entry.id,
            confidence: entry.confidence,
            filePath: entry.filePath,
            fileName: entry.fileName,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
          },

          // File tracking
          source_type: entry.fileName ? 'file_upload' : 'manual',
          file_name: entry.fileName,
          file_path: entry.filePath,
          confidence: entry.confidence || 1.0,

          // Metadata
          status: 'active',
          is_active: true,
          version: 1,
          effective_from: new Date(entry.createdAt || Date.now()),
          created_at: new Date(entry.createdAt || Date.now()),
          updated_at: new Date(entry.updatedAt || Date.now())
        }

        const { error } = await supabaseAdmin
          .from('knowledge_base')
          .insert(supabaseEntry)

        if (error) {
          console.error(`❌ Error migrating entry "${entry.topic}":`, error.message)
          results.errors.push({
            topic: entry.topic,
            error: error.message
          })
          results.skipped++
        } else {
          console.log(`✅ Migrated: ${entry.topic}`)
          results.migrated++
        }

      } catch (err: any) {
        console.error(`❌ Exception migrating entry:`, err)
        results.errors.push({
          topic: entry.topic || 'Unknown',
          error: err.message
        })
        results.skipped++
      }
    }

    // Get final count
    const { count: finalCount } = await supabaseAdmin
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('business_unit_id', businessUnitId)

    console.log(`✨ Migration complete! Final count: ${finalCount}`)

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${results.migrated} migrated, ${results.skipped} skipped`,
      results: {
        ...results,
        existingCount,
        finalCount
      }
    })

  } catch (error: any) {
    console.error('💥 Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// GET: Fetch current data from localStorage structure
export async function GET(request: NextRequest) {
  try {
    const businessUnitId = request.nextUrl.searchParams.get('businessUnitId')

    if (!businessUnitId) {
      return NextResponse.json({
        success: false,
        error: 'businessUnitId required'
      }, { status: 400 })
    }

    const { data, error, count } = await supabaseAdmin
      .from('knowledge_base')
      .select('*', { count: 'exact' })
      .eq('business_unit_id', businessUnitId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({
      success: true,
      totalEntries: count,
      entries: data,
      message: `Found ${count} entries in Supabase`
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
