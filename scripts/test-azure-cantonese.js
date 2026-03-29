/**
 * Test Azure Cantonese TTS with different approaches:
 * 1. Plain text (no formatting)
 * 2. Conversational text with punctuation tricks
 * 3. Full SSML with prosody tags, breaks, and pauses
 *
 * Outputs MP3 files you can play to compare.
 */

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const path = require('path');

const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastasia';
if (!SPEECH_KEY) { console.error('Set AZURE_SPEECH_KEY in .env.local'); process.exit(1); }

const outDir = path.join(__dirname, '..', 'test-audio');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Your test sentence
const RAW_TEXT = '各方面令到一啲行业咧嗰个营运咧系受较为大影响嘅，比如教育啊，即系补习社啊。';

// ============================================================
// Version 1: Plain text — no formatting at all
// ============================================================
const PLAIN_TEXT = RAW_TEXT;

// ============================================================
// Version 2: Conversational Cantonese — natural punctuation
// ============================================================
const CONVERSATIONAL_TEXT = '各方面呢...令到一啲行業咧，嗰個營運咧...係受較為大影響嘅。比如教育啊，即係...補習社啊。';

// ============================================================
// Version 3: Full SSML — prosody, breaks, emphasis
// ============================================================
const SSML_TEXT = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-HK">
  <voice name="zh-HK-HiuMaanNeural">
    <prosody rate="-5%" pitch="+2%">
      各方面呢<break time="300ms"/>
      令到一啲行業咧<break time="200ms"/>
      嗰個營運咧<break time="300ms"/>
      係受較為大影響嘅。
      <break time="500ms"/>
      <prosody rate="-10%">比如教育啊</prosody>，
      <break time="300ms"/>
      即係<break time="200ms"/>補習社啊。
    </prosody>
  </voice>
</speak>`.trim();

// ============================================================
// Version 4: More natural — slower, with emphasis
// ============================================================
const SSML_NATURAL = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-HK">
  <voice name="zh-HK-HiuMaanNeural">
    <prosody rate="-15%" pitch="+3%" volume="+5%">
      各方面呢...
      <break time="400ms"/>
      令到一啲行業咧，嗰個營運咧...
      <break time="350ms"/>
      係受較為大影響嘅。
      <break time="600ms"/>
      比如<break time="150ms"/>教育啊，
      <break time="300ms"/>
      即係...補習社啊。
    </prosody>
  </voice>
</speak>`.trim();

// ============================================================
// Version 5: WanLung (Male voice) for comparison
// ============================================================
const SSML_MALE = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-HK">
  <voice name="zh-HK-WanLungNeural">
    <prosody rate="-10%" pitch="+0%">
      各方面呢...
      <break time="400ms"/>
      令到一啲行業咧，嗰個營運咧...
      <break time="350ms"/>
      係受較為大影響嘅。
      <break time="600ms"/>
      比如<break time="150ms"/>教育啊，
      <break time="300ms"/>
      即係...補習社啊。
    </prosody>
  </voice>
</speak>`.trim();

// ============================================================
// Version 6: HiuGaai (Second female voice)
// ============================================================
const SSML_HIUGAAI = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-HK">
  <voice name="zh-HK-HiuGaaiNeural">
    <prosody rate="-10%" pitch="+2%">
      各方面呢...
      <break time="400ms"/>
      令到一啲行業咧，嗰個營運咧...
      <break time="350ms"/>
      係受較為大影響嘅。
      <break time="600ms"/>
      比如<break time="150ms"/>教育啊，
      <break time="300ms"/>
      即係...補習社啊。
    </prosody>
  </voice>
</speak>`.trim();

async function synthesize(text, filename, isSSML = false) {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;

    if (!isSSML) {
      speechConfig.speechSynthesisVoiceName = 'zh-HK-HiuMaanNeural';
    }

    const filePath = path.join(outDir, filename);
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filePath);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    const method = isSSML ? 'speakSsmlAsync' : 'speakTextAsync';

    console.log(`\n🎤 Generating: ${filename}`);
    console.log(`   Type: ${isSSML ? 'SSML' : 'Plain text'}`);

    synthesizer[method](text, (result) => {
      synthesizer.close();
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        const stats = fs.statSync(filePath);
        console.log(`   ✅ Saved: ${filePath} (${(stats.size / 1024).toFixed(1)} KB)`);
        resolve(filePath);
      } else {
        console.log(`   ❌ Error: ${result.errorDetails}`);
        reject(new Error(result.errorDetails));
      }
    }, (err) => {
      synthesizer.close();
      reject(err);
    });
  });
}

async function main() {
  console.log('=== Azure Cantonese TTS Comparison Test ===\n');
  console.log(`Test text: ${RAW_TEXT}\n`);
  console.log(`Output folder: ${outDir}\n`);

  try {
    // Generate all versions
    await synthesize(PLAIN_TEXT, '1_plain.mp3', false);
    await synthesize(CONVERSATIONAL_TEXT, '2_conversational.mp3', false);
    await synthesize(SSML_TEXT, '3_ssml_breaks.mp3', true);
    await synthesize(SSML_NATURAL, '4_ssml_natural.mp3', true);
    await synthesize(SSML_MALE, '5_male_wanlung.mp3', true);
    await synthesize(SSML_HIUGAAI, '6_female_hiugaai.mp3', true);

    console.log('\n=== DONE ===');
    console.log(`\nAll files in: ${outDir}`);
    console.log('\nCompare these files:');
    console.log('  1_plain.mp3         — Raw text, no formatting (baseline)');
    console.log('  2_conversational.mp3 — Conversational punctuation (..., commas)');
    console.log('  3_ssml_breaks.mp3   — SSML with <break> tags + slight prosody');
    console.log('  4_ssml_natural.mp3  — SSML slower rate + more pauses (most natural)');
    console.log('  5_male_wanlung.mp3  — Male voice (WanLung) for comparison');
    console.log('  6_female_hiugaai.mp3 — Second female voice (HiuGaai)');
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

main();
