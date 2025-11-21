const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupChatStorage() {
  console.log('🚀 Setting up chat storage system...\n')

  // Step 1: Run database migration
  console.log('📊 Step 1: Running database migration...')
  const sqlPath = path.join(__dirname, '../sql-migrations/015_create_chat_history_tables.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  try {
    // Split SQL into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') ||
          statement.includes('CREATE POLICY') || statement.includes('CREATE FUNCTION') ||
          statement.includes('CREATE TRIGGER') || statement.includes('ALTER TABLE') ||
          statement.includes('COMMENT ON')) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })
        if (error && !error.message.includes('already exists')) {
          console.error('⚠️  SQL Error:', error.message)
        }
      }
    }
    console.log('✅ Database migration completed\n')
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    console.log('ℹ️  Please run the SQL manually in Supabase Dashboard → SQL Editor\n')
  }

  // Step 2: Create storage bucket
  console.log('📦 Step 2: Creating storage bucket...')
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === 'chat-images')

    if (bucketExists) {
      console.log('✅ Bucket "chat-images" already exists\n')
    } else {
      const { error } = await supabase.storage.createBucket('chat-images', {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      })

      if (error) {
        console.error('❌ Bucket creation error:', error.message)
        console.log('ℹ️  Please create bucket manually in Supabase Dashboard → Storage\n')
      } else {
        console.log('✅ Storage bucket "chat-images" created\n')
      }
    }
  } catch (error) {
    console.error('❌ Storage setup error:', error.message)
  }

  // Step 3: Set storage policies
  console.log('🔒 Step 3: Setting up storage policies...')
  try {
    // Note: Storage policies need to be set via SQL
    console.log('ℹ️  Run these SQL commands in Supabase Dashboard:\n')
    console.log(`
CREATE POLICY "Public can view chat images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chat-images');

CREATE POLICY "Service role can upload chat images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'chat-images');
    `)
  } catch (error) {
    console.error('❌ Policy setup error:', error.message)
  }

  console.log('\n✅ Chat storage setup complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Run the storage policy SQL commands above in Supabase Dashboard')
  console.log('2. Test chat with image upload')
  console.log('3. Check database for saved messages\n')
}

setupChatStorage().catch(console.error)
