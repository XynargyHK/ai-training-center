"""
Voice Swap — shared spare part.
Swaps TTS voice to a native speaker for the target language.
Used by: translate tool, switch_language tool, auto-detect swapper.
"""
from loguru import logger
from config.voices import LANGUAGE_VOICES, MULTILINGUAL_VOICE


def swap_tts_voice(tts_service, language: str) -> str:
    """Swap the TTS voice to match the target language.

    Args:
        tts_service: The Azure TTS service instance
        language: Language name (e.g. "vietnamese", "cantonese")

    Returns:
        The new voice name that was set
    """
    voice = LANGUAGE_VOICES.get(language.lower(), MULTILINGUAL_VOICE)
    try:
        old_voice = tts_service._settings.voice
        if voice != old_voice:
            tts_service._settings.voice = voice
            logger.info(f"TTS voice swap: {old_voice} → {voice}")
        return voice
    except Exception as e:
        logger.error(f"Could not swap TTS voice: {e}")
        return voice
