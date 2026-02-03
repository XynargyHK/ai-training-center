/**
 * AI-Powered Booster Concern Assignment
 *
 * Analyzes each booster's benefits (face_benefits, eye_benefits, body_benefits, hair_benefits)
 * and uses AI to determine which specific skin concerns each booster addresses.
 *
 * Then creates the proper links in product_attribute_values table.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'; // SkinCoach

// Category to benefit field mapping
const CATEGORY_BENEFIT_MAP = {
  'face': 'face_benefits',
  'eye': 'eye_benefits',
  'body': 'body_benefits',
  'scalp': 'hair_benefits'  // hair_benefits maps to scalp category
};

async function getCategories() {
  const { data } = await supabase
    .from('product_categories')
    .select('id, name, handle')
    .eq('business_unit_id', BUSINESS_UNIT_ID);
  return data || [];
}

async function getSkinConcernsAttribute() {
  const { data } = await supabase
    .from('product_attributes')
    .select('id')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('handle', 'skin_concerns')
    .single();
  return data;
}

async function getConcernsForCategory(attributeId, categoryId) {
  const { data } = await supabase
    .from('product_attribute_options')
    .select('id, name')
    .eq('attribute_id', attributeId)
    .eq('category_id', categoryId);
  return data || [];
}

async function getBoosters() {
  // Get booster type
  const { data: boosterType } = await supabase
    .from('product_types')
    .select('id')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('is_addon', true)
    .single();

  // Get all boosters
  const { data: products } = await supabase
    .from('products')
    .select('id, title, trade_name, face_benefits, eye_benefits, body_benefits, hair_benefits')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('product_type_id', boosterType.id);

  return products || [];
}

async function analyzeConcernsWithAI(boosterTitle, benefitsText, concernsList) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a skincare expert. Analyze the following booster product benefits and determine which skin concerns it addresses.

BOOSTER: ${boosterTitle}

BENEFITS:
${benefitsText}

AVAILABLE SKIN CONCERNS:
${concernsList.map(c => `- ${c.name}`).join('\n')}

Based on the benefits text, which of the above skin concerns does this booster help with?

IMPORTANT: Only return the exact concern names from the list above, separated by commas. If none match, return "NONE".

Example response: "Acne, Oiliness, Large Pores"
Or: "Dark Circles, Eye Bags"
Or: "NONE"

Your response (just the concern names):`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    if (response === 'NONE' || !response) {
      return [];
    }

    // Parse the response and match to actual concern IDs
    const mentionedConcerns = response.split(',').map(s => s.trim().toLowerCase());
    const matchedConcerns = concernsList.filter(c =>
      mentionedConcerns.some(mc =>
        c.name.toLowerCase() === mc ||
        c.name.toLowerCase().includes(mc) ||
        mc.includes(c.name.toLowerCase())
      )
    );

    return matchedConcerns;
  } catch (error) {
    console.error(`  AI Error for ${boosterTitle}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('=== AI-Powered Booster Concern Assignment ===\n');

  // Get data
  const categories = await getCategories();
  const attribute = await getSkinConcernsAttribute();
  const boosters = await getBoosters();

  console.log(`Categories: ${categories.map(c => c.name).join(', ')}`);
  console.log(`Boosters: ${boosters.length}`);
  console.log(`Attribute ID: ${attribute.id}\n`);

  // Build concerns map by category
  const concernsByCategory = {};
  for (const cat of categories) {
    concernsByCategory[cat.handle] = await getConcernsForCategory(attribute.id, cat.id);
    console.log(`${cat.name} concerns: ${concernsByCategory[cat.handle].map(c => c.name).join(', ')}`);
  }

  console.log('\n--- Processing Boosters ---\n');

  const allInserts = [];

  for (const booster of boosters) {
    console.log(`\n${booster.title} (${booster.trade_name || 'no trade name'})`);

    // Process each category
    for (const [catHandle, benefitField] of Object.entries(CATEGORY_BENEFIT_MAP)) {
      const benefitsText = booster[benefitField];

      if (!benefitsText) {
        continue;
      }

      const concerns = concernsByCategory[catHandle];
      if (!concerns || concerns.length === 0) {
        continue;
      }

      console.log(`  Analyzing ${catHandle.toUpperCase()} benefits...`);

      // Use AI to determine which concerns this booster addresses
      const matchedConcerns = await analyzeConcernsWithAI(
        booster.title,
        benefitsText,
        concerns
      );

      if (matchedConcerns.length > 0) {
        console.log(`    -> ${matchedConcerns.map(c => c.name).join(', ')}`);

        for (const concern of matchedConcerns) {
          allInserts.push({
            product_id: booster.id,
            attribute_id: attribute.id,
            option_id: concern.id
          });
        }
      } else {
        console.log(`    -> No specific concerns matched`);
      }

      // Rate limiting - small delay between AI calls
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n--- Inserting ${allInserts.length} concern links ---\n`);

  if (allInserts.length > 0) {
    // Delete existing booster concern links
    const boosterIds = boosters.map(b => b.id);
    await supabase
      .from('product_attribute_values')
      .delete()
      .in('product_id', boosterIds);

    console.log('Deleted existing links');

    // Insert new links in batches
    const batchSize = 50;
    for (let i = 0; i < allInserts.length; i += batchSize) {
      const batch = allInserts.slice(i, i + batchSize);
      const { error } = await supabase
        .from('product_attribute_values')
        .insert(batch);

      if (error) {
        console.error('Insert error:', error);
      } else {
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} links`);
      }
    }

    console.log(`\n✅ SUCCESS! Inserted ${allInserts.length} booster-concern links`);
  }
}

main().catch(console.error);
