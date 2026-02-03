const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toAnchorSlug(name) {
  if (!name) return '(no-name)';
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

async function showBlockAnchors() {
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', 'skincoach')
    .single();

  const { data: page } = await supabase
    .from('landing_pages')
    .select('blocks')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .single();

  console.log('Block Name → Anchor ID (use in menu URL)');
  console.log('='.repeat(55));
  page?.blocks?.forEach((b, i) => {
    const anchor = toAnchorSlug(b.name);
    console.log(`${i+1}. "${b.name || '(unnamed)'}" → #${anchor}`);
  });
}

showBlockAnchors().catch(console.error);
