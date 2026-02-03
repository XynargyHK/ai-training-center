import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SKINCOACH_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2';
const AIA_ID = '45d0f68d-b220-4054-ad36-6623d3b85976';

(async () => {
  // Load guidelines from SkinCoach
  const { data: guidelines, error: loadError } = await supabase
    .from('guidelines')
    .select('*')
    .eq('business_unit_id', SKINCOACH_ID);

  if (loadError) {
    console.error('Error loading guidelines:', loadError);
    process.exit(1);
  }

  console.log(`Found ${guidelines.length} guidelines in SkinCoach`);

  // Copy to AIA
  const timestamp = Date.now();
  const guidelinesToInsert = guidelines.map((g, index) => ({
    business_unit_id: AIA_ID,
    original_id: `guideline-${timestamp}-${index}`,
    category: g.category,
    title: g.title,
    content: g.content,
    embedding: g.embedding,
    embedding_model: g.embedding_model,
    embedded_at: g.embedded_at
  }));

  const { error: insertError } = await supabase
    .from('guidelines')
    .insert(guidelinesToInsert);

  if (insertError) {
    console.error('Error inserting guidelines:', insertError);
    process.exit(1);
  }

  console.log(`✅ Copied ${guidelines.length} guidelines to AIA`);
})();
