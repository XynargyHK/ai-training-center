require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLinks() {
  console.log('🔧 Fixing footer links format...\n');

  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, footer')
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  const footer = data.footer || {};
  const links = footer.links || [];

  console.log('Current links:');
  links.forEach(l => console.log(`  ${l.label}: ${l.url}`));

  // Convert #xxx to ?policy=xxx for policy links
  const policyTypes = ['about-us', 'terms-of-service', 'privacy-policy', 'refund-policy', 'shipping-policy', 'guarantee'];

  const fixedLinks = links.map(link => {
    if (link.url.startsWith('#') && link.url.length > 1) {
      const policyType = link.url.substring(1); // Remove #
      if (policyTypes.includes(policyType)) {
        return { ...link, url: '?policy=' + policyType };
      }
    }
    return link;
  });

  console.log('\nFixed links:');
  fixedLinks.forEach(l => console.log(`  ${l.label}: ${l.url}`));

  // Update the footer
  const { error: updateError } = await supabase
    .from('landing_pages')
    .update({ footer: { ...footer, links: fixedLinks } })
    .eq('id', data.id);

  if (updateError) {
    console.error('\n❌ Update error:', updateError);
  } else {
    console.log('\n✅ Links updated successfully!');
  }
}

fixLinks();
