"""
Switch Language Tool — restart call with new language settings.
Lives in PIPECAT (not Brain) because it needs to message the browser.

Input: language (string)
Output: status, instruction
Side effect: sends switch-language message to browser → call restarts
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams
from config.voices import LANGUAGE_CODES


schema = FunctionSchema(
    name="switch_language",
    description="Switch the AI's speaking language. Use when user says 'speak Mandarin', 'switch to Japanese', 'talk in French', etc. After switching, respond in the new language.",
    properties={
        "language": {
            "type": "string",
            "description": "Target language: english, mandarin, cantonese, japanese, korean, french, spanish, german, vietnamese"
        }
    },
    required=["language"],
)


def create_handler(transport):
    """Create the switch_language handler with access to transport.

    Args:
        transport: The Daily transport (needed to send message to browser)
    """
    async def handle(params: FunctionCallParams):
        from pipecat.transports.daily.transport import DailyOutputTransportMessageFrame
        language = params.arguments.get("language", "english").lower()
        lang_code = LANGUAGE_CODES.get(language, "en")
        logger.info(f"Switching language to {language} (code: {lang_code})")
        try:
            await transport.output().send_message(
                DailyOutputTransportMessageFrame(message={
                    "type": "switch-language",
                    "lang": lang_code,
                })
            )
        except Exception as e:
            logger.error(f"Could not send switch-language to browser: {e}")
        await params.result_callback({
            "status": "restarting",
            "language": language,
            "instruction": f"The call is restarting with {language} language settings. Say a brief goodbye in the current language.",
        })
    return handle


def register(llm, transport):
    """Register this tool with the LLM service."""
    llm.register_function("switch_language", create_handler(transport))
