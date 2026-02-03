const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: products } = await supabase
    .from('products')
    .select('title, product_type_id, product_types(id, name)')
    .order('title');

  const byType = {};
  products.forEach(p => {
    const typeName = p.product_types?.name || 'No Type';
    if (!byType[typeName]) byType[typeName] = [];
    byType[typeName].push(p.title);
  });

  Object.keys(byType).sort().forEach(type => {
    console.log(type + ' (' + byType[type].length + '):');
    byType[type].forEach(t => console.log('  -', t));
    console.log('');
  });

  const { data: types } = await supabase
    .from('product_types')
    .select('id, name')
    .order('name');

  console.log('All Product Types:');
  types.forEach(t => console.log(' ', t.id, ':', t.name));
}
check();
