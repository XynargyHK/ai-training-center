"""
Translate Tool — real-time translation mode.
Lives in PIPECAT (not Brain) because it needs direct TTS voice swap.

Input: target_language (string)
Output: status, instruction for LLM to follow
Side effect: swaps TTS voice to native speaker
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams
from parts.voice_swap import swap_tts_voice


# Tool definition — tells Gemini this function exists
schema = FunctionSchema(
    name="translate",
    description="Start real-time translation mode. The user speaks in their language, and you translate and speak in the target language. Use when user says 'translate to Mandarin', 'be my interpreter for Japanese', etc.",
    properties={
        "target_language": {
            "type": "string",
            "description": "The language to translate INTO: english, mandarin, cantonese, japanese, korean, french, spanish, german, vietnamese"
        }
    },
    required=["target_language"],
)


def create_handler(tts_service):
    """Create the translate handler with access to the TTS service.

    Args:
        tts_service: The Azure TTS service instance (needed for voice swap)

    Returns:
        Async handler function for Pipecat function calling
    """
    async def handle(params: FunctionCallParams):
        target = params.arguments.get("target_language", "english").lower()
        voice = swap_tts_voice(tts_service, target)
        logger.info(f"Translation mode: {target}, voice: {voice}")
        await params.result_callback({
            "status": "translating",
            "target_language": target,
            "instruction": (
                f"TRANSLATION MODE ACTIVE. From now on, EVERY response must be "
                f"in {target} ONLY. No matter what language the user speaks, "
                f"always translate into {target}. NEVER respond in the user's "
                f"language. NEVER add commentary. Just output the translation. "
                f"Stay in this mode until the user says 'stop translating' or "
                f"'switch to English'."
            ),
        })
    return handle


def register(llm, tts_service):
    """Register this tool with the LLM service."""
    llm.register_function("translate", create_handler(tts_service))
