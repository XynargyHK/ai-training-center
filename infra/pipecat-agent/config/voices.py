"""
Voice configuration — native Azure TTS voices for each language.
This file is DATA ONLY. Never changes unless adding a new language.
"""

# Native Azure TTS voices — proper native speakers for each language
LANGUAGE_VOICES = {
    "english": "en-US-JennyMultilingualNeural",
    "mandarin": "zh-CN-XiaoxiaoNeural",
    "cantonese": "zh-HK-WanLungNeural",
    "japanese": "ja-JP-NanamiNeural",
    "korean": "ko-KR-SunHiNeural",
    "french": "fr-FR-DeniseNeural",
    "spanish": "es-ES-ElviraNeural",
    "german": "de-DE-KatjaNeural",
    "vietnamese": "vi-VN-HoaiMyNeural",
}

MULTILINGUAL_VOICE = "en-US-JennyMultilingualNeural"

# Language name → STT/restart code
LANGUAGE_CODES = {
    "english": "en",
    "mandarin": "zh",
    "cantonese": "yue",
    "japanese": "ja",
    "korean": "ko",
    "french": "fr",
    "spanish": "es",
    "german": "de",
    "vietnamese": "vi",
}
