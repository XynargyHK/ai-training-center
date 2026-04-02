"""
Switch Language Tool — change speaking language mid-call.
Lives in PIPECAT because it needs direct TTS voice swap.

Input: language (string)
Output: status + instruction for LLM
Side effect: swaps TTS voice to native speaker
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams
from config.voices import LANGUAGE_VOICES, MULTILINGUAL_VOICE


schema = FunctionSchema(
    name="switch_language",
    description="Switch the AI's speaking language. Use when user says 'speak Mandarin', 'switch to Japanese', 'talk in French', etc. After switching, respond in the new language.",
    properties={
        "language": {
            "type": "string",
            "description": "Target language: english, mandarin, cantonese, japanese, korean, french, spanish, german"
        }
    },
    required=["language"],
)


def create_handler(tts_service):
    async def handle(params: FunctionCallParams):
        language = params.arguments.get("language", "english").lower()
        voice = LANGUAGE_VOICES.get(language, MULTILINGUAL_VOICE)
        logger.info(f"Switching language to {language}, voice: {voice}")
        try:
            tts_service._settings.voice = voice
            logger.info(f"TTS voice updated to {voice}")
        except Exception as e:
            logger.error(f"Could not update TTS voice: {e}")
        await params.result_callback({
            "status": "switched",
            "language": language,
            "instruction": f"From now on, respond ONLY in {language}. Do not use English unless asked to switch back."
        })
    return handle


def register(llm, tts_service):
    llm.register_function("switch_language", create_handler(tts_service))
