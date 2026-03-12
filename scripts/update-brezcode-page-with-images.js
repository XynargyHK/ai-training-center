const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

const PAGE_ID = 'dd8fecf5-12f1-4f3d-b0bf-68ae1a2c59a2';

async function updatePage() {
  console.log('🔄 Fetching current page data...');
  const { data: page, error: fetchError } = await supabase
    .from('landing_pages')
    .select('blocks')
    .eq('id', PAGE_ID)
    .single();

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }

  // Find the "How It Works" or "Steps" block
  // If not found, we'll create a new one based on the B2B tutorial
  const tutorialBlock = {
    id: crypto.randomUUID(),
    type: 'accordion',
    name: 'B2B Quick Exam Tutorial',
    order: 2,
    data: {
      heading: '45分鐘專業乳房健康檢測流程',
      heading_font_family: 'Josefin Sans',
      heading_font_size: '2.5rem',
      background_color: '#f9fafb',
      items: [
        {
          title: 'STEP 1: 系統登入與客戶管理',
          content: '美容師使用平板電腦登入 BioRhythm 系統，進入「我的病人」頁面並點擊「新增客戶」，輸入客戶的基本資料（姓名、電話、年齡等）。',
          image_url: 'https://utqxzbnbqwuxwonxhryn.supabase.co/storage/v1/object/public/media-library/43890556-457d-40ea-8544-a86b82943c18/library/brezcode-b2b-step-0-1773305469626.jpg',
          image_position: 'above'
        },
        {
          title: 'STEP 2: 設備配對與連接',
          content: '長按檢測設備按鈕5秒直至藍燈閃爍。在平板上點擊「開始監測」，系統將自動搜索並連接左右兩側的感測器。',
          image_url: 'https://utqxzbnbqwuxwonxhryn.supabase.co/storage/v1/object/public/media-library/43890556-457d-40ea-8544-a86b82943c18/library/brezcode-b2b-step-11-1773305570151.jpg',
          image_position: 'above'
        },
        {
          title: 'STEP 3: 設備佩戴指引',
          content: '將感測器貼在乳房指定位置（與乳頭成45度角）。確保金屬探頭與皮膚直接接觸，以獲得最準確的溫度與濕度數據。',
          image_url: 'https://utqxzbnbqwuxwonxhryn.supabase.co/storage/v1/object/public/media-library/43890556-457d-40ea-8544-a86b82943c18/library/brezcode-b2b-step-1-1773305478543.jpg',
          image_position: 'above'
        },
        {
          title: 'STEP 4: 45分鐘快速監測',
          content: '檢測期間，平板會顯示實時數據曲線。客戶可以照常進行非熱力類的美容護理。系統會自動進行倒計時。',
          image_url: 'https://utqxzbnbqwuxwonxhryn.supabase.co/storage/v1/object/public/media-library/43890556-457d-40ea-8544-a86b82943c18/library/brezcode-b2b-step-2-1773305488250.jpg',
          image_position: 'above'
        },
        {
          title: 'STEP 5: 數據上傳與 AI 評級',
          content: '完成後點擊「上傳數據」。AI 系統會立即分析數據並生成 1-5 級的乳房健康評級報告，方便美容師提供專業建議。',
          image_url: 'https://utqxzbnbqwuxwonxhryn.supabase.co/storage/v1/object/public/media-library/43890556-457d-40ea-8544-a86b82943c18/library/brezcode-b2b-step-8-1773305540900.jpg',
          image_position: 'above'
        }
      ]
    }
  };

  // Replace or add the block
  const updatedBlocks = [...page.blocks];
  const existingIdx = updatedBlocks.findIndex(b => b.name === 'B2B Quick Exam Tutorial');
  if (existingIdx !== -1) {
    updatedBlocks[existingIdx] = tutorialBlock;
  } else {
    // Insert after hero stats
    updatedBlocks.splice(1, 0, tutorialBlock);
  }

  const { error: updateError } = await supabase
    .from('landing_pages')
    .update({ blocks: updatedBlocks })
    .eq('id', PAGE_ID);

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('✅ Successfully updated BrezCode landing page with manual images!');
  }
}

updatePage();
