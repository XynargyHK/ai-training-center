// Test smarter AI assignment for Blue Peptide Revive Booster
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function test() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const productData = {
    title: 'Blue Peptide Revive Booster',
    description: "The molecule of youth, reborn in blue. Copper Tripeptide-1 is nature's intelligent signal peptide — awakening the skin's regenerative code. It restores firmness, heals from within, and revives cellular vitality.",
    face_benefits: "Visibly tightening and firming the skin by boosting collagen and elastin synthesis. Reduces fine lines and wrinkles by up to 70% in 12 weeks. Heals and renews damaged skin, accelerating recovery from acne marks, irritation, and sun exposure. Refines texture and radiance, reducing photoaging and uneven pigmentation. Balances oil production.",
    body_benefits: "Promotes wound and scar repair, supporting skin regeneration. Reduces stretch marks and roughness.",
    hair_benefits: "Stimulates new hair growth, increasing follicle vitality by up to 29%. Strengthens anchoring fibers. Enhances scalp healing and microcirculation, balancing oil and reducing inflammation.",
    eye_benefits: "Tightens and smooths delicate eye contours, reducing crow's feet and crepiness. Fades dark circles and puffiness.",
    key_actives: 'Copper Tripeptide-1 (GHK-Cu)'
  };

  const concerns = [
    'Acne', 'Cellulite', "Crow's Feet", 'Cysts/Nodules', 'Dandruff',
    'Dark Circles', 'Dry Scalp', 'Dry Skin', 'Dryness', 'Eczema',
    'Eye Bags', 'Fine Lines/Wrinkles', 'Hair Loss/Thinning', 'Large Pores',
    'Oily Scalp', 'Pigmentation/Dark Spots', 'Premature Graying', 'Psoriasis',
    'Rashes', 'Redness/Rosacea', 'Sagging', 'Scalp Acne', 'Scalp Irritation',
    'Sensitivity', 'Stretch Marks', 'Underarm Odor', 'Uneven Texture', 'Varicose Veins'
  ];

  const prompt = `You are a skincare expert. Based on this product's ACTUAL benefits and ingredients, select ONLY the skin concerns it can genuinely treat.

PRODUCT: ${productData.title}
KEY ACTIVE: ${productData.key_actives}
FACE BENEFITS: ${productData.face_benefits}
BODY BENEFITS: ${productData.body_benefits}
HAIR BENEFITS: ${productData.hair_benefits}
EYE BENEFITS: ${productData.eye_benefits}

AVAILABLE CONCERNS:
${concerns.join(', ')}

RULES:
1. ONLY select concerns that the product DIRECTLY addresses based on its documented benefits
2. Do NOT select concerns just because they sound related - the product must explicitly target them
3. Maximum 8 concerns per product
4. Be STRICT - if unsure, do not include
5. "Acne" means active acne treatment, not just "heals acne marks" (that's pigmentation)
6. "Scalp Irritation" requires the product to specifically treat scalp irritation, not just "balancing oil"

Return ONLY a JSON array of concern names, nothing else. Example: ["Fine Lines/Wrinkles", "Sagging"]`;

  console.log('=== Smarter AI Assignment for Blue Peptide Revive Booster ===\n');
  console.log('Asking Gemini...\n');

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  console.log('AI Response:', text);

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    console.log('\n=== Recommended Concerns (' + parsed.length + ') ===');
    parsed.forEach(c => console.log(' ✓', c));

    console.log('\n=== Current Assignments (13) ===');
    const current = ['Acne', 'Fine Lines/Wrinkles', 'Pigmentation/Dark Spots', 'Sagging',
      'Sensitivity', 'Uneven Texture', "Crow's Feet", 'Dark Circles', 'Eye Bags',
      'Stretch Marks', 'Hair Loss/Thinning', 'Oily Scalp', 'Scalp Irritation'];
    current.forEach(c => {
      const inNew = parsed.includes(c);
      console.log(inNew ? ' ✓' : ' ✗', c, inNew ? '' : '(REMOVE)');
    });
  } catch(e) {
    console.log('Parse error:', e.message);
  }
}

test();
