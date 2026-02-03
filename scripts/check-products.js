require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Check all products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, status, business_unit_id, created_at, metadata')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('=== Recent Products ===');
  if (error) {
    console.log('Error:', error);
  } else if (!products || products.length === 0) {
    console.log('No products found in database');
  } else {
    products.forEach(p => {
      console.log('[' + p.status + '] ' + p.title + ' (created: ' + p.created_at + ')');
    });
  }
}

check();
