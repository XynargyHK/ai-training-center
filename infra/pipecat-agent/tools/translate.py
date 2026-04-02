"""
Translate Tool — real-time translation mode.
Lives in PIPECAT because it needs direct TTS voice swap.

Input: target_language (string)
Output: status + instruction for LLM
Side effect: swaps TTS voice to native speaker
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams
from config.voices import LANGUAGE_VOICES, MULTILINGUAL_VOICE


schema = FunctionSchema(
    name="translate",
    description="Start real-time translation mode. The user speaks in their language, and you translate and speak in the target language. Use when user says 'translate to Mandarin', 'be my interpreter for Japanese', etc.",
    properties={
        "target_language": {
            "type": "string",
            "description": "The language to translate INTO: english, mandarin, cantonese, japanese, korean, french, spanish, german"
        }
    },
    required=["target_language"],
)


def create_handler(tts_service):
    async def handle(params: FunctionCallParams):
        target = params.arguments.get("target_language", "english").lower()
        voice = LANGUAGE_VOICES.get(target, MULTILINGUAL_VOICE)
        logger.info(f"Translation mode: translating to {target}, voice: {voice}")
        try:
            tts_service._settings.voice = voice
        except Exception as e:
            logger.error(f"Could not update TTS voice: {e}")
        await params.result_callback({
            "status": "translating",
            "target_language": target,
            "instruction": f"TRANSLATION MODE ACTIVE. From now on, EVERY response must be in {target} ONLY. No matter what language the user speaks, always translate into {target}. NEVER respond in the user's language. NEVER add commentary. Just output the translation. Stay in this mode until the user says 'stop translating' or 'switch to English'."
        })
    return handle


def register(llm, tts_service):
    llm.register_function("translate", create_handler(tts_service))
