const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFilenames() {
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('slug', 'skincoach')
    .single();

  console.log('Business Unit:', bu.name);

  // Get all locales
  const locales = [
    { country: 'US', language: 'en' },
    { country: 'HK', language: 'en' },
    { country: 'HK', language: 'zh' }
  ];

  for (const loc of locales) {
    console.log('\n========== ' + loc.country + '/' + loc.language + ' ==========');

    const { data: page } = await supabase
      .from('landing_pages')
      .select('hero_slides, blocks')
      .eq('business_unit_id', bu.id)
      .eq('country', loc.country)
      .eq('language_code', loc.language)
      .single();

    if (!page) {
      console.log('  Not found');
      continue;
    }

    // Check hero slides
    console.log('Hero slides:');
    if (page.hero_slides) {
      page.hero_slides.forEach((s, i) => {
        const hasUrl = !!s.background_url;
        const hasFn = !!s.original_filename;
        const status = hasUrl ? (hasFn ? '[OK]' : '[MISSING filename]') : '[no media]';
        console.log('  Slide ' + (i+1) + ': ' + status + (hasFn ? ' - ' + s.original_filename : ''));
      });
    }

    // Check blocks
    console.log('Blocks:');
    if (page.blocks) {
      page.blocks.forEach((b, i) => {
        const type = b.type;
        const heading = b.data?.heading || b.data?.headline || b.name || '';

        if (b.data?.steps) {
          let missing = 0;
          let total = 0;
          let missingSteps = [];
          b.data.steps.forEach((step, si) => {
            if (step.background_url) {
              total++;
              if (!step.original_filename) {
                missing++;
                missingSteps.push(si + 1);
              }
            }
          });
          const status = total > 0 ? (missing > 0 ? '[MISSING ' + missing + '/' + total + ' - steps ' + missingSteps.join(',') + ']' : '[OK ' + total + ' files]') : '[no media]';
          console.log('  Block ' + (i+1) + ' (' + type + '): "' + heading.substring(0,30) + '" ' + status);
        } else if (b.data?.background_url) {
          const hasFn = !!b.data.original_filename;
          const status = hasFn ? '[OK]' : '[MISSING filename]';
          console.log('  Block ' + (i+1) + ' (' + type + '): "' + heading.substring(0,30) + '" ' + status + (hasFn ? ' - ' + b.data.original_filename : ''));
        } else {
          console.log('  Block ' + (i+1) + ' (' + type + '): "' + heading.substring(0,30) + '" [no media]');
        }
      });
    }
  }
}

checkFilenames().catch(console.error);
