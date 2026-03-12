const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function generatePage() {
  // Use BrezCode business unit ID
  const BREZCODE_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'; // Assuming based on previous logs, will check if needed
  
  const blocks = [
    {
      id: 'step-0-form',
      type: 'form',
      name: 'Step 0: Registration',
      order: 0,
      data: {
        headline: 'Step 0: Register Your Location',
        subheadline: 'Enter your physical address to assign location-specific credentials.',
        fields: [
          { id: 'f1', label: 'Physical Address', placeholder: 'Enter the full street address', type: 'text', required: true },
          { id: 'f2', label: 'Location Name', placeholder: 'e.g. TST Branch', type: 'text', required: true }
        ],
        submit_button_text: 'Get My Credentials',
        submit_button_color: '#2563eb',
        success_message: 'Registration successful! Your location username and password have been generated.',
        background_color: '#f8fafc',
        border_radius: '0.75rem'
      }
    },
    {
      id: 'main-steps',
      type: 'steps',
      name: 'How to Operate BrezCode',
      order: 1,
      data: {
        heading: 'Operational Guide',
        overall_layout: 'vertical',
        steps: [
          {
            title: '1. Client Account Login',
            text_content: 'Access "BioRhythm (Breast)" screen. Login with your registered phone number and password.',
            image_width: '400px',
            text_position: 'right'
          },
          {
            title: '2. Device Pairing',
            text_content: 'Power on devices (hold 5s for blue light). Pair Left (L) and Right (R) devices within 1 meter of the tablet.',
            image_width: '400px',
            text_position: 'left'
          },
          {
            title: '3. Placement & Wearing',
            text_content: 'Attach devices at 45° angle relative to areola. Ensure metal probes have firm, direct skin contact.',
            image_width: '400px',
            text_position: 'right'
          },
          {
            title: '4. Real-time Monitoring',
            text_content: 'Track data curves for temperature and humidity. Minimum 8 hours required for Holter monitoring.',
            image_width: '400px',
            text_position: 'left'
          },
          {
            title: '5. Data Upload & Report',
            text_content: 'Once 100% complete, click "Upload Data". Access results via "Report Management" section.',
            image_width: '400px',
            text_position: 'right'
          }
        ]
      }
    },
    {
      id: 'troubleshooting',
      type: 'accordion',
      name: 'Troubleshooting FAQ',
      order: 2,
      data: {
        headline: 'Troubleshooting Guide',
        items: [
          { title: 'Device not powering on?', content: 'Charge device. Hold button for 5 seconds until blue light flashes. Do not long-press if already on.' },
          { title: 'Bluetooth pairing failed?', content: 'Reset Bluetooth on tablet. Delete and re-add the "BHolter" WeChat mini-program.' },
          { title: 'Data upload stuck?', content: 'Check Wi-Fi connection. Close and restart the mini-program.' }
        ]
      }
    },
    {
      id: 'final-cta',
      type: 'static_banner',
      name: 'Platform Link',
      order: 3,
      data: {
        headline: 'Ready to Launch?',
        subheadline: 'Access the full DMS management platform below.',
        cta_text: 'Open DMS Platform',
        cta_url: 'https://dmsprod.hkbiorhythm.com',
        background_color: '#1e293b',
        headline_color: '#ffffff',
        subheadline_color: '#94a3b8'
      }
    }
  ];

  const pageData = {
    business_unit_id: BREZCODE_ID,
    country: 'HK',
    language_code: 'en',
    slug: 'how-to-use',
    hero_headline: 'BrezCode Monitor System',
    hero_subheadline: 'Official Operational Manual & Setup Guide',
    blocks: blocks,
    is_active: true
  };

  console.log('✨ Creating/Updating "How to Use" landing page for BrezCode...');
  
  const { data: existingPage } = await supabase
    .from('landing_pages')
    .select('id')
    .eq('business_unit_id', BREZCODE_ID)
    .eq('slug', 'how-to-use')
    .maybeSingle();

  let result;
  if (existingPage) {
    console.log(`🔄 Updating existing page (ID: ${existingPage.id})...`);
    result = await supabase
      .from('landing_pages')
      .update(pageData)
      .eq('id', existingPage.id);
  } else {
    console.log('✨ Inserting new page...');
    result = await supabase
      .from('landing_pages')
      .insert(pageData);
  }

  if (result.error) {
    console.error('❌ Error:', result.error);
  } else {
    console.log('✅ Successfully generated landing page: /how-to-use');
  }
}

generatePage();
