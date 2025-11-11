const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTrainingTables() {
  try {
    console.log('🚀 Creating training data tables automatically...\n')

    // STEP 1: Create Categories table
    console.log('📁 Creating categories table...')
    const categoriesSQL = `
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

        name TEXT NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
        icon TEXT,
        color TEXT,
        sort_order INTEGER DEFAULT 0,

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_categories_business_unit ON categories(business_unit_id);
      CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
    `

    await supabase.rpc('exec_sql', { sql_query: categoriesSQL })
    console.log('✅ Categories table created\n')

    // STEP 2: Create Canned Messages table
    console.log('💬 Creating canned_messages table...')
    const cannedMessagesSQL = `
      CREATE TABLE IF NOT EXISTS canned_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

        title TEXT NOT NULL,
        shortcut TEXT,
        message TEXT NOT NULL,
        variables JSONB DEFAULT '[]'::jsonb,

        -- Context
        use_case TEXT,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        language TEXT DEFAULT 'en',

        -- Metadata
        usage_count INTEGER DEFAULT 0,
        last_used_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );

      CREATE INDEX IF NOT EXISTS idx_canned_messages_business_unit ON canned_messages(business_unit_id);
      CREATE INDEX IF NOT EXISTS idx_canned_messages_category ON canned_messages(category_id);
      CREATE INDEX IF NOT EXISTS idx_canned_messages_shortcut ON canned_messages(shortcut);
      CREATE INDEX IF NOT EXISTS idx_canned_messages_tags ON canned_messages USING GIN(tags);

      ALTER TABLE canned_messages ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Service role has full access" ON canned_messages;
      CREATE POLICY "Service role has full access" ON canned_messages
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    `

    await supabase.rpc('exec_sql', { sql_query: cannedMessagesSQL })
    console.log('✅ Canned messages table created\n')

    // STEP 3: Create FAQ Library table
    console.log('❓ Creating faq_library table...')
    const faqLibrarySQL = `
      CREATE TABLE IF NOT EXISTS faq_library (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        short_answer TEXT,

        -- Search & Discovery
        keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
        related_questions TEXT[] DEFAULT ARRAY[]::TEXT[],
        search_terms TEXT,

        -- Context
        difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        product_related UUID REFERENCES products(id) ON DELETE SET NULL,

        -- Analytics
        view_count INTEGER DEFAULT 0,
        helpful_count INTEGER DEFAULT 0,
        not_helpful_count INTEGER DEFAULT 0,
        last_viewed_at TIMESTAMPTZ,

        -- Status
        is_published BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );

      CREATE INDEX IF NOT EXISTS idx_faq_business_unit ON faq_library(business_unit_id);
      CREATE INDEX IF NOT EXISTS idx_faq_category ON faq_library(category_id);
      CREATE INDEX IF NOT EXISTS idx_faq_product ON faq_library(product_related);
      CREATE INDEX IF NOT EXISTS idx_faq_keywords ON faq_library USING GIN(keywords);
      CREATE INDEX IF NOT EXISTS idx_faq_published ON faq_library(is_published);

      ALTER TABLE faq_library ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Service role has full access" ON faq_library;
      CREATE POLICY "Service role has full access" ON faq_library
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    `

    await supabase.rpc('exec_sql', { sql_query: faqLibrarySQL })
    console.log('✅ FAQ library table created\n')

    // STEP 4: Create Training Conversations table
    console.log('💭 Creating training_conversations table...')
    const trainingConversationsSQL = `
      CREATE TABLE IF NOT EXISTS training_conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

        title TEXT NOT NULL,
        description TEXT,

        -- Conversation data
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        participants JSONB DEFAULT '[]'::jsonb,

        -- Training value
        is_good_example BOOLEAN DEFAULT true,
        learning_points TEXT[] DEFAULT ARRAY[]::TEXT[],
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],

        -- Metadata
        difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        estimated_duration INTEGER, -- in minutes
        usage_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2),

        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_training_conv_business_unit ON training_conversations(business_unit_id);
      CREATE INDEX IF NOT EXISTS idx_training_conv_category ON training_conversations(category_id);
      CREATE INDEX IF NOT EXISTS idx_training_conv_tags ON training_conversations USING GIN(tags);

      ALTER TABLE training_conversations ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Service role has full access" ON training_conversations;
      CREATE POLICY "Service role has full access" ON training_conversations
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    `

    await supabase.rpc('exec_sql', { sql_query: trainingConversationsSQL })
    console.log('✅ Training conversations table created\n')

    // STEP 5: Insert sample data
    console.log('📝 Adding sample data...\n')

    const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

    // Add sample categories
    const { data: categories } = await supabase
      .from('categories')
      .insert([
        {
          business_unit_id: BUSINESS_UNIT_ID,
          name: 'Greetings',
          description: 'Welcome and greeting messages',
          icon: '👋',
          color: '#4CAF50',
          sort_order: 1
        },
        {
          business_unit_id: BUSINESS_UNIT_ID,
          name: 'Product Questions',
          description: 'Product-related inquiries',
          icon: '🛍️',
          color: '#2196F3',
          sort_order: 2
        },
        {
          business_unit_id: BUSINESS_UNIT_ID,
          name: 'Closing',
          description: 'Goodbye and closing messages',
          icon: '👋',
          color: '#FF9800',
          sort_order: 3
        }
      ])
      .select()

    console.log(`✅ Added ${categories?.length || 0} sample categories`)

    // Add sample canned messages
    const { data: cannedMessages } = await supabase
      .from('canned_messages')
      .insert([
        {
          business_unit_id: BUSINESS_UNIT_ID,
          category_id: categories?.[0]?.id,
          title: 'Welcome Message',
          shortcut: '/welcome',
          message: 'Hello {{customer_name}}! Welcome to {{business_name}}. How can I help you today?',
          variables: ['customer_name', 'business_name'],
          tags: ['greeting', 'welcome'],
          use_case: 'First contact with customer'
        },
        {
          business_unit_id: BUSINESS_UNIT_ID,
          category_id: categories?.[1]?.id,
          title: 'Product Recommendation',
          shortcut: '/recommend',
          message: 'Based on your {{skin_concern}}, I recommend our {{product_name}}. It contains {{key_ingredients}} which are perfect for {{benefit}}.',
          variables: ['skin_concern', 'product_name', 'key_ingredients', 'benefit'],
          tags: ['product', 'recommendation'],
          use_case: 'Recommending products based on customer needs'
        },
        {
          business_unit_id: BUSINESS_UNIT_ID,
          category_id: categories?.[2]?.id,
          title: 'Thank You & Closing',
          shortcut: '/thanks',
          message: 'Thank you for chatting with us today! If you have any other questions, feel free to reach out anytime. Have a wonderful day!',
          variables: [],
          tags: ['closing', 'thankyou'],
          use_case: 'Ending conversation positively'
        }
      ])
      .select()

    console.log(`✅ Added ${cannedMessages?.length || 0} sample canned messages`)

    // Add sample FAQs
    const { data: faqs } = await supabase
      .from('faq_library')
      .insert([
        {
          business_unit_id: BUSINESS_UNIT_ID,
          category_id: categories?.[1]?.id,
          question: 'What is the difference between serum and booster?',
          answer: 'A serum is a lightweight skincare product designed to deliver high concentrations of active ingredients. A booster is a concentrated treatment that you add to your existing skincare routine to enhance specific benefits. Boosters are typically more potent and can be mixed with serums, moisturizers, or used alone.',
          short_answer: 'Serums are standalone products; boosters are concentrated add-ons to enhance your routine.',
          keywords: ['serum', 'booster', 'difference', 'skincare', 'routine'],
          difficulty_level: 'beginner',
          is_featured: true
        },
        {
          business_unit_id: BUSINESS_UNIT_ID,
          category_id: categories?.[1]?.id,
          question: 'How do I use a facial booster?',
          answer: 'Apply 2-3 drops of booster to clean, damp skin. You can use it alone or mix it with your serum or moisturizer. Gently massage into face and neck using upward motions. Use morning and/or evening as directed. Always follow with SPF during the day.',
          short_answer: 'Apply 2-3 drops to clean skin, alone or mixed with other products.',
          keywords: ['usage', 'application', 'how to use', 'booster', 'steps'],
          difficulty_level: 'beginner',
          is_featured: true
        },
        {
          business_unit_id: BUSINESS_UNIT_ID,
          category_id: categories?.[1]?.id,
          question: 'Can I use multiple boosters together?',
          answer: 'Yes, you can layer multiple boosters, but start slowly. Begin with one booster and introduce others gradually. Apply thinnest to thickest consistency. Some combinations work better than others - for example, vitamin C and hyaluronic acid complement each other well. Avoid mixing retinol with strong acids like AHAs/BHAs in the same routine.',
          short_answer: 'Yes, but introduce gradually and layer thin to thick. Some combinations are better than others.',
          keywords: ['layering', 'multiple', 'combination', 'mixing'],
          difficulty_level: 'intermediate'
        }
      ])
      .select()

    console.log(`✅ Added ${faqs?.length || 0} sample FAQs`)

    // Verification
    console.log('\n' + '='.repeat(60))
    console.log('📊 VERIFICATION')
    console.log('='.repeat(60))

    const tables = ['categories', 'canned_messages', 'faq_library', 'training_conversations']
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('business_unit_id', BUSINESS_UNIT_ID)

      console.log(`✅ ${table}: ${count || 0} records`)
    }

    console.log('\n🎉 SUCCESS! All training tables created automatically!')
    console.log('\n📋 What you can now do:')
    console.log('  ✅ Create canned messages for quick responses')
    console.log('  ✅ Build FAQ library for common questions')
    console.log('  ✅ Store training conversations')
    console.log('  ✅ Organize everything with categories')
    console.log('\n💡 View in Supabase:')
    console.log('   https://supabase.com/dashboard/project/utqxzbnbqwuxwonxhryn/editor')

  } catch (error) {
    console.error('💥 Error:', error.message)
    console.error(error)
  }
}

createTrainingTables()
