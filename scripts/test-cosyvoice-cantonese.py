# Test CosyVoice 3.0-0.5B Cantonese TTS locally.
# Generates audio files you can compare with Azure.
import sys, os, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, 'C:/Users/Denny/CosyVoice')
sys.path.insert(0, 'C:/Users/Denny/CosyVoice/third_party/Matcha-TTS')

import torch
import torchaudio

print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

# Import CosyVoice
from cosyvoice.cli.cosyvoice import CosyVoice3

print("\nLoading CosyVoice 0.5B model...")
model = CosyVoice3('C:/Users/Denny/CosyVoice/pretrained_models/Fun-CosyVoice3-0.5B-2512')
print("Model loaded!\n")

# Output directory
out_dir = os.path.join(os.path.dirname(__file__), '..', 'test-audio-cosyvoice')
os.makedirs(out_dir, exist_ok=True)

# Test texts — your original + customer service phrases
tests = [
    {
        'name': '01_user_original',
        'text': '各方面令到一啲行业咧嗰个营运咧系受较为大影响嘅，比如教育啊，即系补习社啊。',
        'instruct': 'You are a helpful assistant. 请用广东话表达。',
    },
    {
        'name': '02_cs_greeting',
        'text': '你好啊，我係SkinCoach嘅客服，有咩可以幫到你呀？',
        'instruct': 'You are a helpful assistant. 请用广东话表达。',
    },
    {
        'name': '03_cs_product',
        'text': '呢個產品咧，好多客人都話用完之後皮膚滑咗好多，你可以試下先，唔啱嘅話可以退返嘅。',
        'instruct': 'You are a helpful assistant. 请用广东话表达。',
    },
    {
        'name': '04_cs_empathy',
        'text': '明白嘅，我好理解你嘅感受。等我幫你睇下有咩辦法解決，你唔使擔心。',
        'instruct': 'You are a helpful assistant. 请用广东话表达。',
    },
    {
        'name': '05_cs_closing',
        'text': '好嘅，咁就咁先啦。如果之後有任何問題，隨時搵我哋就得㗎喇。拜拜！',
        'instruct': 'You are a helpful assistant. 请用广东话表达。',
    },
]

# Use one of the Azure-generated files as voice reference for cloning
# Convert MP3 to WAV first (CosyVoice needs WAV)
import soundfile as sf
import numpy as np
azure_mp3 = os.path.join(os.path.dirname(__file__), '..', 'test-audio-v2', 'HiuGaai_F2_03_cs_greeting.mp3')
prompt_wav = os.path.join(out_dir, '_prompt_reference.wav')

if os.path.exists(azure_mp3) and not os.path.exists(prompt_wav):
    print(f"Converting Azure MP3 to WAV for voice reference...")
    # Use torchaudio to convert
    waveform, sr = torchaudio.load(azure_mp3)
    # Resample to 22050 if needed
    if sr != 22050:
        resampler = torchaudio.transforms.Resample(sr, 22050)
        waveform = resampler(waveform)
    torchaudio.save(prompt_wav, waveform, 22050)
    print(f"Reference WAV saved: {prompt_wav}")
elif not os.path.exists(azure_mp3):
    print(f"WARNING: No Azure reference file found at {azure_mp3}")
    print("Using cross-lingual mode instead")
for t in tests:
    print(f">> Generating: {t['name']}")
    print(f"   Text: {t['text'][:50]}...")

    try:
        # instruct2 with the Cantonese instruction and placeholder prompt
        output_list = list(model.inference_instruct2(
            t['text'],
            t['instruct'] + '<|endofprompt|>',
            prompt_wav,
            stream=False,
        ))

        if output_list:
            audio = output_list[0]['tts_speech']
            filepath = os.path.join(out_dir, f"{t['name']}.wav")
            torchaudio.save(filepath, audio, 22050)
            print(f"   ✅ Saved: {filepath}")
        else:
            print(f"   ❌ No output")
    except Exception as e:
        print(f"   ❌ Error: {e}")

print(f"\n=== DONE ===")
print(f"Files in: {out_dir}")
print("Compare these with Azure files in test-audio-v2/")
