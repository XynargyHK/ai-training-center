require('dotenv').config({ path: '.env.local' });

async function testBulkImport() {
  const testProducts = [
    {
      name: 'Test Face Serum',
      description: 'A brightening facial serum for anti-aging and wrinkle reduction'
    },
    {
      name: 'Test Body Lotion',
      description: 'Body contouring cream for cellulite and stretch marks'
    },
    {
      name: 'Test Hair Tonic',
      description: 'Scalp treatment for hair growth and dandruff control'
    }
  ];

  console.log('Testing bulk import with AI categorization...\n');

  const response = await fetch('http://localhost:3000/api/products/bulk-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      products: testProducts,
      businessUnitId: 'breast-guardian',
      useAiCategorization: true
    })
  });

  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));
}

testBulkImport().catch(console.error);
