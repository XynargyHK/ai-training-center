/**
 * Automated Database Backup Script
 * Backs up all Supabase tables to timestamped JSON files
 * Scheduled to run at 10am and 10pm daily via Windows Task Scheduler
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Backup destination folder
const BACKUP_DIR = path.join('C:', 'Users', 'Denny', '.claude', 'projects', 'C--Users-Denny-ai-training-center', 'backups')

// Keep last 30 backups (15 days x 2 per day)
const MAX_BACKUPS = 30

// All tables to back up
const TABLES = [
  'business_units',
  'landing_pages',
  'products',
  'product_variants',
  'product_categories',
  'product_types',
  'product_templates',
  'product_addon_matches',
  'product_attributes',
  'product_attribute_options',
  'product_attribute_values',
  'customer_concerns',
  'customer_profiles',
  'appointments',
  'outlets',
  'ai_staff',
  'training_scenarios',
  'training_sessions',
  'guidelines',
  'orders',
  'order_items'
]

async function backupTable(tableName) {
  try {
    // Fetch all rows (paginate for large tables)
    let allRows = []
    let offset = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error(`  Error backing up ${tableName}:`, error.message)
        return { table: tableName, rows: 0, error: error.message }
      }

      if (!data || data.length === 0) break
      allRows = allRows.concat(data)
      if (data.length < pageSize) break
      offset += pageSize
    }

    return { table: tableName, rows: allRows.length, data: allRows }
  } catch (err) {
    console.error(`  Exception backing up ${tableName}:`, err.message)
    return { table: tableName, rows: 0, error: err.message }
  }
}

function cleanOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .sort()
    .reverse()

  // Delete files beyond MAX_BACKUPS
  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS)
    toDelete.forEach(f => {
      const filePath = path.join(BACKUP_DIR, f)
      fs.unlinkSync(filePath)
      console.log(`  Deleted old backup: ${f}`)
    })
  }
}

async function main() {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  const dateStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })

  console.log(`\n=== Database Backup ===`)
  console.log(`Date: ${dateStr} ${timeStr}`)
  console.log(`Backing up ${TABLES.length} tables...\n`)

  // Ensure backup directory exists
  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  // Back up all tables
  const results = []
  const backupData = {}
  const tableSummary = {}

  for (const table of TABLES) {
    process.stdout.write(`  ${table}...`)
    const result = await backupTable(table)
    results.push(result)
    if (result.data) {
      backupData[table] = result.data
      tableSummary[table] = result.rows
    } else {
      tableSummary[table] = `ERROR: ${result.error}`
    }
    console.log(` ${result.rows} rows`)
  }

  const totalRows = results.reduce((sum, r) => sum + r.rows, 0)
  const errors = results.filter(r => r.error)

  // Build backup file
  const backup = {
    backup_timestamp: now.toISOString(),
    backup_date: dateStr,
    backup_time: timeStr,
    project: 'ai-training-center',
    supabase_url: supabaseUrl,
    total_tables: TABLES.length,
    total_rows: totalRows,
    errors: errors.length,
    table_summary: tableSummary,
    data: backupData
  }

  // Save backup
  const filename = `backup-${timestamp}.json`
  const filePath = path.join(BACKUP_DIR, filename)
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))

  console.log(`\nBackup saved: ${filePath}`)
  console.log(`Total: ${totalRows} rows across ${TABLES.length} tables`)
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length} tables had issues`)
  }

  console.log('Done.\n')
}

main().catch(err => {
  console.error('Backup failed:', err)
  process.exit(1)
})
