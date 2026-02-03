require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');

async function importBoosters() {
  // Read Excel file
  const workbook = XLSX.readFile('knowledgebase/Booster descriptions and pricing_1763561573275.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} products in Excel\n`);

  // Map Excel columns to our product fields (keep ALL content exactly as-is)
  const products = data.map(row => ({
    name: row['Product Name'],
    tagline: row['Tagline'],
    ingredients: row['Ingredients'],
    hero_benefit: row['Hero Benefit Summary'],
    key_actives: row['Key Actives'],
    face_benefits: row['Face Benefits'],
    body_benefits: row['Body Benefit'],
    hair_benefits: row['Hair/Scalp Benefits'],
    eye_benefits: row['Eye Benefits'],
    clinical: row['Clinical Highlight'],
    trade_name: row['Trade Name'],
    cost_2ml: row['Cost 2ml'],
    retail_2ml: row['Retail 2ml'],
    retail_30ml: row['Retail 30ml']
  })).filter(p => p.name);

  console.log('Products to import:');
  products.forEach(p => {
    console.log(`  - ${p.name}`);
    console.log(`    Tagline: ${p.tagline?.substring(0, 50)}...`);
    console.log(`    Ingredients: ${p.ingredients?.substring(0, 50)}...`);
    console.log(`    Hero: ${p.hero_benefit?.substring(0, 50)}...`);
  });

  // Import to skincoach with product type = booster
  console.log('\n\nImporting to skincoach as Booster type...\n');

  const response = await fetch('http://localhost:3000/api/products/bulk-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      products,
      businessUnitId: 'skincoach',
      productTypeHandle: 'booster',
      useAiCategorization: true
    })
  });

  const result = await response.json();
  console.log('Import result:', JSON.stringify(result, null, 2));

  // Verify by checking database
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: imported } = await supabase
    .from('products')
    .select(`
      title,
      tagline,
      ingredients,
      hero_benefit,
      key_actives,
      face_benefits,
      body_benefits,
      hair_benefits,
      eye_benefits,
      clinical_studies,
      trade_name,
      product_types(name),
      product_category_mapping(product_categories(name))
    `)
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2') // SkinCoach
    .order('title');

  console.log('\n=== Imported Products ===');
  imported?.forEach(p => {
    const cats = p.product_category_mapping?.map(m => m.product_categories?.name) || [];
    console.log(`\n${p.title}`);
    console.log(`  Type: ${p.product_types?.name || 'None'}`);
    console.log(`  Categories: ${cats.join(', ') || 'None'}`);
    console.log(`  Tagline: ${p.tagline?.substring(0, 60) || 'None'}...`);
    console.log(`  Ingredients: ${p.ingredients ? 'Yes (' + p.ingredients.length + ' chars)' : 'None'}`);
    console.log(`  Hero Benefit: ${p.hero_benefit ? 'Yes (' + p.hero_benefit.length + ' chars)' : 'None'}`);
    console.log(`  Key Actives: ${p.key_actives ? 'Yes (' + p.key_actives.length + ' chars)' : 'None'}`);
    console.log(`  Face Benefits: ${p.face_benefits ? 'Yes (' + p.face_benefits.length + ' chars)' : 'None'}`);
    console.log(`  Body Benefits: ${p.body_benefits ? 'Yes (' + p.body_benefits.length + ' chars)' : 'None'}`);
    console.log(`  Hair Benefits: ${p.hair_benefits ? 'Yes (' + p.hair_benefits.length + ' chars)' : 'None'}`);
    console.log(`  Eye Benefits: ${p.eye_benefits ? 'Yes (' + p.eye_benefits.length + ' chars)' : 'None'}`);
    console.log(`  Clinical: ${p.clinical_studies ? 'Yes (' + p.clinical_studies.length + ' chars)' : 'None'}`);
    console.log(`  Trade Name: ${p.trade_name || 'None'}`);
  });
}

importBoosters().catch(console.error);
