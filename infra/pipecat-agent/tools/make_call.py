"""
Make Call Tool — opens phone dialer on user's device.
Pipecat-local: needs transport to send message to browser.
"""
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

schema = FunctionSchema(
    name="make_call",
    description="Initiate a phone call. Opens the phone dialer on the user's device.",
    properties={
        "phone": {"type": "string", "description": "Phone number with country code, e.g. +85296099766"}
    },
    required=["phone"],
)


def create_handler(transport):
    async def handle(params: FunctionCallParams):
        from pipecat.transports.livekit.transport import LiveKitOutputTransportMessageFrame
        phone = params.arguments.get("phone", "")
        if not phone.startswith("+"):
            phone = "+" + phone
        url = f"tel:{phone}"
        logger.info(f"Making call: {url}")
        try:
            await transport.output().send_message(LiveKitOutputTransportMessageFrame(message={"type": "open-url", "url": url}))
        except Exception as e:
            logger.error(f"Could not trigger call: {e}")
        await params.result_callback({"status": "dialing", "phone": phone})
    return handle


def register(llm, transport):
    llm.register_function("make_call", create_handler(transport))
