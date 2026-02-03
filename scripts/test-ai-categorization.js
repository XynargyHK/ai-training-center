require('dotenv').config({ path: '.env.local' });

async function testAI() {
  const GEMINI_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    console.log('No Gemini API key found');
    return;
  }

  const products = [
    { name: 'Bright+ Booster', description: 'Brightening facial serum for skin tone' },
    { name: 'Lift+ Booster', description: 'Anti-aging lifting treatment for face' },
    { name: 'Hair Growth Serum', description: 'Scalp treatment for hair regrowth' }
  ];

  const productList = products.map((p, idx) =>
    `${idx + 1}. "${p.name}" - ${p.description}`
  ).join('\n');

  const prompt = `You are a skincare product categorizer. For each product below, determine which body area(s) it targets.

Products:
${productList}

Available categories:
- Face (facial skincare, anti-aging, brightening, acne, wrinkles)
- Body (body contouring, cellulite, stretch marks, body firming)
- Eye (eye area, dark circles, puffiness, crow's feet)
- Scalp (hair care, hair growth, scalp treatment, dandruff, gray hair)

Return a JSON array with format:
[{"index": 1, "categories": ["Face", "Eye"]}, {"index": 2, "categories": ["Body"]}, ...]

Only return valid JSON, no explanation.`;

  console.log('Testing Gemini AI categorization...\n');
  console.log('Prompt:\n', prompt, '\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    }
  );

  const result = await response.json();
  console.log('Response status:', response.status);

  if (result.error) {
    console.error('API Error:', result.error);
    return;
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('Raw response text:', text);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('\nParsed categories:');
    parsed.forEach(p => {
      console.log(`  Product ${p.index}: ${p.categories.join(', ')}`);
      console.log(`    Lowercased: ${p.categories.map(c => c.toLowerCase()).join(', ')}`);
    });
  } else {
    console.log('No JSON found in response');
  }
}

testAI().catch(console.error);
