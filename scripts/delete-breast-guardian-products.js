require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteBreastGuardianProducts() {
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('slug', 'breast-guardian')
    .single();

  console.log('Business Unit:', bu?.name, bu?.id);

  if (!bu) {
    console.log('Breast Guardian not found');
    return;
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, title')
    .eq('business_unit_id', bu.id);

  console.log('Products in Breast Guardian:', products?.length || 0);

  if (products && products.length > 0) {
    for (const p of products) {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', p.id);

      if (variants && variants.length > 0) {
        for (const v of variants) {
          await supabase.from('product_variant_prices').delete().eq('variant_id', v.id);
        }
        await supabase.from('product_variants').delete().eq('product_id', p.id);
      }
      await supabase.from('product_category_mapping').delete().eq('product_id', p.id);
    }

    const { error: delError } = await supabase
      .from('products')
      .delete()
      .eq('business_unit_id', bu.id);

    if (delError) console.log('Error:', delError.message);
    else console.log('Deleted all products from Breast Guardian');
  }

  const { data: remaining } = await supabase
    .from('products')
    .select('id')
    .eq('business_unit_id', bu.id);

  console.log('Remaining:', remaining?.length || 0);
}

deleteBreastGuardianProducts().catch(console.error);
