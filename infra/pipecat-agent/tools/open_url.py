"""
Open URL Tool — opens a URL on the user's browser.
Pipecat-local: needs transport to send message to browser.
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

schema = FunctionSchema(
    name="open_url",
    description="Open a URL on the user's device. Use for websites (https://cnn.com), phone calls (tel:+852...), WhatsApp (https://wa.me/852...), email (mailto:...), or maps.",
    properties={
        "url": {"type": "string", "description": "The full URL to open"}
    },
    required=["url"],
)


def create_handler(transport):
    async def handle(params: FunctionCallParams):
        from pipecat.transports.livekit.transport import LiveKitOutputTransportMessageFrame
        url = params.arguments.get("url", "")
        if not url.startswith(("http", "tel:", "mailto:", "geo:")):
            url = "https://" + url
        logger.info(f"Opening URL: {url}")
        try:
            await transport.output().send_message(LiveKitOutputTransportMessageFrame(message={"type": "open-url", "url": url}))
        except Exception as e:
            logger.error(f"Could not send URL to browser: {e}")
        await params.result_callback({"status": "opened", "url": url})
    return handle


def register(llm, transport):
    llm.register_function("open_url", create_handler(transport))
