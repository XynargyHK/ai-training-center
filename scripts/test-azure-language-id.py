"""
Test Azure Speech auto language identification.
Tests if Azure can detect Cantonese (zh-HK) vs Mandarin (zh-CN) vs English (en-US).
Run: python scripts/test-azure-language-id.py
"""
import os
import azure.cognitiveservices.speech as speechsdk

# Load from .env.local
speech_key = os.getenv("AZURE_SPEECH_KEY", "")
speech_region = os.getenv("AZURE_SPEECH_REGION", "eastus")

if not speech_key:
    # Try loading from .env.local
    try:
        with open(".env.local") as f:
            for line in f:
                if line.startswith("AZURE_SPEECH_KEY="):
                    speech_key = line.strip().split("=", 1)[1]
                elif line.startswith("AZURE_SPEECH_REGION="):
                    speech_region = line.strip().split("=", 1)[1]
    except FileNotFoundError:
        print("No .env.local found. Set AZURE_SPEECH_KEY env var.")

print(f"Region: {speech_region}")
print(f"Key: {speech_key[:8]}...")

# Configure speech
speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=speech_region)

# Enable continuous language identification
speech_config.set_property(
    property_id=speechsdk.PropertyId.SpeechServiceConnection_LanguageIdMode,
    value="Continuous"
)

# Candidate languages - including Cantonese!
auto_detect_config = speechsdk.languageconfig.AutoDetectSourceLanguageConfig(
    languages=["en-US", "zh-HK", "zh-CN", "vi-VN", "ja-JP", "ko-KR"]
)

# Use microphone input
audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)

# Create recognizer with auto-detect
recognizer = speechsdk.SpeechRecognizer(
    speech_config=speech_config,
    auto_detect_source_language_config=auto_detect_config,
    audio_config=audio_config,
)

print("\n=== Azure Language ID Test ===")
print("Candidates: en-US, zh-HK (Cantonese), zh-CN (Mandarin), vi-VN, ja-JP, ko-KR")
print("Speak in any language. Say 'stop' or press Ctrl+C to quit.\n")

done = False

def on_recognized(evt):
    result = evt.result
    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        # Get detected language
        auto_detect_result = speechsdk.AutoDetectSourceLanguageResult(result)
        detected_lang = auto_detect_result.language
        confidence = auto_detect_result.properties.get(
            speechsdk.PropertyId.SpeechServiceConnection_AutoDetectSourceLanguageResult, ""
        )
        print(f"[{detected_lang}] {result.text}")
    elif result.reason == speechsdk.ResultReason.NoMatch:
        print("(no speech detected)")

def on_canceled(evt):
    global done
    print(f"Canceled: {evt.reason}")
    if evt.reason == speechsdk.CancellationReason.Error:
        print(f"Error: {evt.error_details}")
    done = True

recognizer.recognized.connect(on_recognized)
recognizer.canceled.connect(on_canceled)

# Start continuous recognition
recognizer.start_continuous_recognition()

try:
    import time
    while not done:
        time.sleep(0.5)
except KeyboardInterrupt:
    print("\nStopping...")

recognizer.stop_continuous_recognition()
print("Done.")
