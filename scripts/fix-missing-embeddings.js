/**
 * Fix Missing Embeddings
 * Finds all DB entries with NULL embeddings and generates them using OpenAI.
 * This fixes the issue where the AI "doesn't know anything" about a business unit.
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
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: cleanText,
    encoding_format: 'float'
  });
  return response.data[0].embedding;
}

async function fixKnowledgeBase() {
  console.log('🔍 Checking knowledge_base...');
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, topic, content, category')
    .is('embedding', null);

  if (error) throw error;
  console.log(`📊 Found ${data.length} knowledge entries missing embeddings.`);

  for (const entry of data) {
    console.log(`✨ Generating embedding for: ${entry.topic || entry.id}`);
    const combinedText = [entry.category, entry.topic, entry.content].filter(Boolean).join(' | ');
    const embedding = await generateEmbedding(combinedText);
    
    const { error: updateErr } = await supabase
      .from('knowledge_base')
      .update({ 
        embedding,
        embedding_model: 'text-embedding-3-small',
        embedded_at: new Date().toISOString()
      })
      .eq('id', entry.id);
    
    if (updateErr) console.error(`❌ Error updating ${entry.id}:`, updateErr.message);
  }
}

async function fixFAQs() {
  console.log('🔍 Checking faq_library...');
  const { data, error } = await supabase
    .from('faq_library')
    .select('id, question, answer')
    .is('embedding', null);

  if (error) throw error;
  console.log(`📊 Found ${data.length} FAQs missing embeddings.`);

  for (const entry of data) {
    console.log(`✨ Generating embedding for FAQ: ${entry.question?.substring(0, 50)}...`);
    const combinedText = `${entry.question} ${entry.answer}`;
    const embedding = await generateEmbedding(combinedText);
    
    await supabase
      .from('faq_library')
      .update({ 
        embedding,
        embedding_model: 'text-embedding-3-small',
        embedded_at: new Date().toISOString()
      })
      .eq('id', entry.id);
  }
}

async function main() {
  try {
    console.log('🚀 Starting embedding fix...');
    await fixKnowledgeBase();
    await fixFAQs();
    console.log('✅ ALL EMBEDDINGS FIXED! The AI should now know its stuff.');
  } catch (err) {
    console.error('💥 CRITICAL ERROR:', err);
  }
}

main();
