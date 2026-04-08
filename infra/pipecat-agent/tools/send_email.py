"""
Send Email Tool — opens email compose on user's device.
Pipecat-local: needs transport to send message to browser.
"""
import urllib.parse
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

schema = FunctionSchema(
    name="send_email",
    description="Open an email compose window on the user's device.",
    properties={
        "to": {"type": "string", "description": "Email address"},
        "subject": {"type": "string", "description": "Email subject line"},
        "body": {"type": "string", "description": "Email body text"},
    },
    required=["to"],
)


def create_handler(transport):
    async def handle(params: FunctionCallParams):
        from pipecat.transports.livekit.transport import LiveKitOutputTransportMessageFrame
        to = params.arguments.get("to", "")
        subject = urllib.parse.quote(params.arguments.get("subject", ""))
        body = urllib.parse.quote(params.arguments.get("body", ""))
        url = f"mailto:{to}?subject={subject}&body={body}"
        logger.info(f"Sending email: {url[:100]}")
        try:
            await transport.output().send_message(LiveKitOutputTransportMessageFrame(message={"type": "open-url", "url": url}))
        except Exception as e:
            logger.error(f"Could not trigger email: {e}")
        await params.result_callback({"status": "opened", "to": to})
    return handle


def register(llm, transport):
    llm.register_function("send_email", create_handler(transport))
