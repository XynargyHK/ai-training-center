const XLSX = require('xlsx');

async function analyzeWithGemini() {
  const workbook = XLSX.readFile('knowledgebase/Booster descriptions and pricing_1763561573275.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const products = data.map(row => ({
    name: row['Product Name'],
    tagline: row['Tagline'],
    hero_benefit: row['Hero Benefit Summary'],
    key_actives: row['Key Actives'],
    face: row['Face Benefits'] ? 'Yes' : 'No',
    body: row['Body Benefit'] ? 'Yes' : 'No',
    hair: row['Hair/Scalp Benefits'] ? 'Yes' : 'No',
    eye: row['Eye Benefits'] ? 'Yes' : 'No',
    cost_2ml: row['Cost 2ml'],
    retail_2ml: row['Retail 2ml'],
    retail_30ml: row['Retail 30ml']
  })).filter(p => p.name);

  console.log(`Found ${products.length} products to analyze...\n`);

  const prompt = `You are a skincare/beauty product expert. Analyze these booster products and categorize them.

For each product, provide:
1. PRIMARY_CATEGORY: Choose ONE from: Anti-Aging, Brightening, Acne & Oil Control, Hydration, Body Contouring, Hair Care, Eye Care, Skin Repair, Multi-Purpose
2. SECONDARY_CATEGORY: Choose ONE different from primary (or "None")
3. TARGET_AREAS: List applicable areas (Face, Body, Hair, Eyes, Scalp)
4. SKIN_CONCERNS: List 2-3 specific concerns this addresses
5. BUNDLE_SUGGESTIONS: Name 2 other products from this list that would pair well

Products to analyze:
${JSON.stringify(products, null, 2)}

Return as JSON array with format:
[
  {
    "name": "Product Name",
    "primary_category": "...",
    "secondary_category": "...",
    "target_areas": ["Face", "Body"],
    "skin_concerns": ["Wrinkles", "Sagging"],
    "bundle_with": ["Product A", "Product B"],
    "ai_description": "A 50-word marketing description"
  }
]

Only return valid JSON, no markdown or explanation.`;

  const GEMINI_KEY = process.env.GOOGLE_GEMINI_API_KEY || 'AIzaSyDB1-P3YhXYdisyA11gLcPwlDeMwQwwFKM';

  console.log('Sending to Gemini 2.5 Flash...\n');

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8000
      }
    })
  });

  const result = await response.json();

  console.log('Response status:', response.status);

  if (!result.candidates) {
    console.error('No candidates in response:', JSON.stringify(result, null, 2));
    return;
  }

  if (result.candidates && result.candidates[0]) {
    console.log('Candidate:', JSON.stringify(result.candidates[0], null, 2).slice(0, 500));
    const text = result.candidates[0].content?.parts?.[0]?.text;
    if (!text) {
      console.error('No text in response');
      return;
    }
    // Extract JSON from response
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('=== GEMINI AI CATEGORIZATION RESULTS ===\n');
      parsed.forEach((p, i) => {
        console.log(`${i+1}. ${p.name}`);
        console.log(`   Primary: ${p.primary_category}`);
        console.log(`   Secondary: ${p.secondary_category}`);
        console.log(`   Target: ${p.target_areas.join(', ')}`);
        console.log(`   Concerns: ${p.skin_concerns.join(', ')}`);
        console.log(`   Bundle with: ${p.bundle_with.join(', ')}`);
        console.log(`   Description: ${p.ai_description}`);
        console.log('');
      });

      // Also save to file
      require('fs').writeFileSync('scripts/categorized-products.json', JSON.stringify(parsed, null, 2));
      console.log('\n✅ Saved to scripts/categorized-products.json');
    } else {
      console.log('Raw response:', text);
    }
  } else {
    console.error('Error:', JSON.stringify(result, null, 2));
  }
}

analyzeWithGemini().catch(console.error);
