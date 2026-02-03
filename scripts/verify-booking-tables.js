#!/usr/bin/env node
/**
 * Verify Booking System Database Tables
 * Run: node scripts/verify-booking-tables.js
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyTables() {
  console.log('\n🔍 Verifying Booking System Database Tables...\n')

  const tables = [
    'chat_sessions',
    'chat_messages',
    'service_staff_assignments',
    'appointment_change_requests',
    'appointment_change_history'
  ]

  const results = []

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        results.push({ table, status: '❌', error: error.message, count: 0 })
      } else {
        results.push({ table, status: '✅', error: null, count: count || 0 })
      }
    } catch (err) {
      results.push({ table, status: '❌', error: err.message, count: 0 })
    }
  }

  // Display results
  console.log('Table Verification Results:\n')
  console.log('─'.repeat(70))
  results.forEach(({ table, status, error, count }) => {
    const paddedTable = table.padEnd(35)
    const countStr = `${count} rows`.padEnd(15)
    console.log(`${status} ${paddedTable} ${countStr}`)
    if (error) {
      console.log(`   Error: ${error}`)
    }
  })
  console.log('─'.repeat(70))

  const allSuccess = results.every(r => r.status === '✅')

  if (allSuccess) {
    console.log('\n✅ All booking system tables verified successfully!')
    console.log('\nNext steps:')
    console.log('  1. Run: npm run dev')
    console.log('  2. Navigate to: http://localhost:3000/booking')
    console.log('  3. Test the booking workflow\n')
  } else {
    console.log('\n❌ Some tables are missing. Please run the SQL migrations.')
    console.log('\nMissing migrations:')
    const failed = results.filter(r => r.status === '❌')
    failed.forEach(({ table }) => {
      if (table.includes('chat')) {
        console.log(`  - sql-migrations/015_create_chat_history_tables.sql`)
      } else if (table.includes('service_staff')) {
        console.log(`  - sql-migrations/019_service_staff_assignments.sql`)
      } else {
        console.log(`  - sql-migrations/020_appointment_workflow.sql`)
      }
    })
    console.log('')
  }
}

// Test database functions
async function verifyFunctions() {
  console.log('\n🔧 Verifying Database Functions...\n')

  const functions = [
    'get_staff_for_service',
    'get_services_for_staff'
  ]

  console.log('Note: Function verification requires test data.')
  console.log('Skipping function tests for now.\n')
}

// Run verification
verifyTables().then(() => {
  console.log('✨ Verification complete!\n')
  process.exit(0)
}).catch(err => {
  console.error('❌ Verification failed:', err)
  process.exit(1)
})
