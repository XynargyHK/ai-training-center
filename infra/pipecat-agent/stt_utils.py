"""
Shared STT utilities for both browser (bot.py) and phone (phone_bot.py).
Contains AutoDetectAzureSTTService for multi-language auto-detection.
"""
import asyncio
from loguru import logger


class AutoDetectAzureSTTService:
    """Azure STT with auto language identification.
    Patches AzureSTTService._connect() to use AutoDetectSourceLanguageConfig.
    Supports continuous language ID — detects language per utterance."""

    @staticmethod
    def create(api_key, region, candidate_languages, sample_rate=24000):
        """Create an AzureSTTService with auto language detection.
        candidate_languages: list like ["en-US", "zh-HK", "zh-CN", "vi-VN", "ja-JP", "ko-KR"]
        """
        from pipecat.services.azure.stt import AzureSTTService
        import azure.cognitiveservices.speech as speechsdk

        # Create base service with first candidate as default
        stt = AzureSTTService(
            api_key=api_key,
            region=region,
            language=candidate_languages[0],
            sample_rate=sample_rate,
        )

        # Monkey-patch the handler methods to extract auto-detected language
        original_on_recognized = stt._on_handle_recognized
        original_on_recognizing = stt._on_handle_recognizing

        def patched_on_recognized(event):
            try:
                auto_result = speechsdk.AutoDetectSourceLanguageResult(event.result)
                if auto_result.language:
                    event.result.language = auto_result.language
                    logger.debug(f"Auto-detect recognized: {auto_result.language}")
            except Exception as e:
                logger.warning(f"Auto-detect language extraction failed: {e}")
            original_on_recognized(event)

        def patched_on_recognizing(event):
            try:
                auto_result = speechsdk.AutoDetectSourceLanguageResult(event.result)
                if auto_result.language:
                    event.result.language = auto_result.language
            except Exception:
                pass
            original_on_recognizing(event)

        # Replace the methods on the instance
        stt._on_handle_recognized = patched_on_recognized
        stt._on_handle_recognizing = patched_on_recognizing

        # Patch _connect to inject auto-detect config
        original_connect = stt._connect

        async def patched_connect():
            if stt._audio_stream:
                return

            try:
                # Set continuous language ID mode
                stt._speech_config.set_property(
                    property_id=speechsdk.PropertyId.SpeechServiceConnection_LanguageIdMode,
                    value="Continuous"
                )

                # Create auto-detect config
                auto_detect_config = speechsdk.languageconfig.AutoDetectSourceLanguageConfig(
                    languages=candidate_languages
                )

                # Create audio stream (matching original _connect exactly)
                from azure.cognitiveservices.speech.audio import AudioStreamFormat, PushAudioInputStream
                from azure.cognitiveservices.speech.dialog import AudioConfig

                stream_format = AudioStreamFormat(samples_per_second=stt.sample_rate, channels=1)
                stt._audio_stream = PushAudioInputStream(stream_format)
                audio_config = AudioConfig(stream=stt._audio_stream)

                # Create recognizer WITH auto-detect (key difference from original)
                stt._speech_recognizer = speechsdk.SpeechRecognizer(
                    speech_config=stt._speech_config,
                    auto_detect_source_language_config=auto_detect_config,
                    audio_config=audio_config,
                )

                # Attach event handlers (uses our patched versions)
                stt._speech_recognizer.recognizing.connect(stt._on_handle_recognizing)
                stt._speech_recognizer.recognized.connect(stt._on_handle_recognized)
                stt._speech_recognizer.canceled.connect(stt._on_handle_canceled)

                # Start continuous recognition (same as original — no .get(), no await)
                stt._speech_recognizer.start_continuous_recognition_async()
                logger.info(f"Azure STT auto-detect started with candidates: {candidate_languages}")
            except Exception as e:
                logger.error(f"Azure auto-detect STT init error: {e}")
                import traceback
                traceback.print_exc()

        stt._connect = patched_connect
        return stt
