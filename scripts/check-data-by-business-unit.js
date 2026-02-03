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

(async () => {
  // Get all business units
  const { data: businessUnits } = await supabase
    .from('business_units')
    .select('id, slug, name')
    .order('created_at');

  for (const bu of businessUnits) {
    console.log(`\n========================================`);
    console.log(`Business Unit: ${bu.name} (${bu.slug})`);
    console.log(`ID: ${bu.id}`);
    console.log(`========================================`);

    // Check canned messages
    const { data: cannedMessages } = await supabase
      .from('canned_messages')
      .select('*')
      .eq('business_unit_id', bu.id);

    console.log(`Canned Messages: ${cannedMessages?.length || 0}`);

    // Check AI staff
    const { data: aiStaff } = await supabase
      .from('ai_staff')
      .select('*')
      .eq('business_unit_id', bu.id);

    console.log(`AI Staff: ${aiStaff?.length || 0}`);
    if (aiStaff && aiStaff.length > 0) {
      aiStaff.forEach(staff => {
        console.log(`  - ${staff.name} (${staff.role})`);
      });
    }

    // Check FAQs
    const { data: faqs } = await supabase
      .from('faq_library')
      .select('*')
      .eq('business_unit_id', bu.id);

    console.log(`FAQs: ${faqs?.length || 0}`);

    // Check knowledge
    const { data: knowledge } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('business_unit_id', bu.id);

    console.log(`Knowledge entries: ${knowledge?.length || 0}`);
  }
})();
