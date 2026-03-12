const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API_KEY);

async function translateContent(text, targetLang = 'Traditional Chinese (Hong Kong)') {
  if (!text || typeof text !== 'string' || text.length < 2) return text;
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Translate the following text to ${targetLang}. Preserve any HTML tags, variables like {{name}}, or special formatting. Return ONLY the translated text.\n\nText: ${text}`;
    
    const result = await model.generateContent(prompt);
    const translated = result.response.text().trim();
    return translated;
  } catch (error) {
    console.error('❌ Translation error:', error);
    return text;
  }
}

async function translateObject(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') return await translateContent(obj);
  if (Array.isArray(obj)) {
    return await Promise.all(obj.map(item => translateObject(item)));
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip keys that shouldn't be translated (IDs, URLs, colors, etc.)
      if (['id', 'url', 'color', 'icon', 'active', 'enabled', 'type', 'image', 'bg_image', 'video_url', 'anchor_id', 'business_unit_id', 'country', 'language_code', 'created_at', 'updated_at', 'text_align', 'text_color', 'image_width', 'font_family', 'font_size', 'line_height', 'letter_spacing', 'margin_bottom', 'bg_color', 'border_color', 'border_radius', 'padding', 'width', 'height'].includes(key)) {
        newObj[key] = value;
      } else {
        newObj[key] = await translateObject(value);
      }
    }
    return newObj;
  }
  return obj;
}

async function startTranslation() {
  const BREAST_GUARDIAN_ID = '346db81c-0b36-4cb7-94f4-d126a3a54fa1';
  
  console.log('🔍 Fetching Breast Guardian HK/TW landing page for translation...');
  
  const { data: twPage, error: twError } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', BREAST_GUARDIAN_ID)
    .eq('country', 'HK')
    .eq('language_code', 'zh-TW')
    .single();

  if (twError || !twPage) {
    console.error('❌ HK/TW page not found:', twError);
    return;
  }

  console.log('🎨 Translating page content (this may take a while)...');

  const translatedPage = {
    hero_headline: await translateContent(twPage.hero_headline),
    hero_subheadline: await translateContent(twPage.hero_subheadline),
    hero_cta_text: await translateContent(twPage.hero_cta_text),
    hero_slides: await translateObject(twPage.hero_slides),
    blocks: await translateObject(twPage.blocks),
    announcements: await translateObject(twPage.announcements),
    menu_bar: await translateObject(twPage.menu_bar),
    footer: await translateObject(twPage.footer),
    announcement_text: await translateContent(twPage.announcement_text),
    footer_disclaimer: await translateContent(twPage.footer_disclaimer)
  };

  console.log('💾 Saving translated content...');

  const { error: updateError } = await supabase
    .from('landing_pages')
    .update(translatedPage)
    .eq('id', twPage.id);

  if (updateError) {
    console.error('❌ Error saving translation:', updateError);
  } else {
    console.log('✅ Successfully translated Breast Guardian HK/TW landing page!');
  }
}

startTranslation();
