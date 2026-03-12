/**
 * Fix Broken Embeddings (Re-index everything)
 * This script ensures embeddings are numerical arrays, not JSON strings.
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text) {
  const cleanText = text.trim().replace(/\n+/g, ' ').substring(0, 30000);
  console.log(`📡 Calling OpenAI for text (${cleanText.length} chars)...`);
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: cleanText,
    encoding_format: 'float'
  });
  return response.data[0].embedding; // This is the array of numbers
}

async function fixTable(tableName, textFields) {
  console.log(`\n🔍 Processing table: ${tableName}...`);
  const { data, error } = await supabase
    .from(tableName)
    .select(`id, ${textFields.join(', ')}`);

  if (error) throw error;
  console.log(`📊 Found ${data.length} entries.`);

  for (const entry of data) {
    const combinedText = textFields.map(f => entry[f]).filter(Boolean).join(' | ');
    if (!combinedText) continue;

    try {
      const embedding = await generateEmbedding(combinedText);
      
      const { error: updateErr } = await supabase
        .from(tableName)
        .update({ 
          embedding,
          embedding_model: 'text-embedding-3-small',
          embedded_at: new Date().toISOString()
        })
        .eq('id', entry.id);
      
      if (updateErr) {
        console.error(`❌ Error updating ${entry.id}:`, updateErr.message);
      } else {
        console.log(`✅ Updated ${tableName} ID: ${entry.id}`);
      }
    } catch (e) {
      console.error(`💥 Failed to process ${entry.id}:`, e.message);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting TOTAL RE-INDEXING...');
    
    // Fix knowledge_base
    await fixTable('knowledge_base', ['category', 'topic', 'content']);
    
    // Fix faq_library
    await fixTable('faq_library', ['question', 'answer']);
    
    // Fix guidelines
    await fixTable('guidelines', ['title', 'content']);

    console.log('\n✨ ALL EMBEDDINGS RE-INDEXED SUCCESSFULLY!');
  } catch (err) {
    console.error('💥 CRITICAL ERROR:', err);
  }
}

main();
