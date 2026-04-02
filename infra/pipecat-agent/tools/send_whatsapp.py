"""
Send WhatsApp Tool — delegates to Brain for execution.
Lives in Brain (single source of truth). Pipecat is a thin proxy.

Input: phone (string), message (string)
Output: status
"""
import os
import aiohttp
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

BRAIN_URL = os.getenv("BRAIN_URL", "http://localhost:8000")

schema = FunctionSchema(
    name="send_whatsapp",
    description="Send a WhatsApp message to a phone number. Use when user says 'message John on WhatsApp', 'send a WhatsApp to 852...', etc.",
    properties={
        "phone": {
            "type": "string",
            "description": "Phone number with country code, e.g. 85296099766"
        },
        "message": {
            "type": "string",
            "description": "The message text to send"
        }
    },
    required=["phone", "message"],
)


def create_handler():
    async def handle(params: FunctionCallParams):
        phone = params.arguments.get("phone", "")
        message = params.arguments.get("message", "")
        logger.info(f"Delegating send_whatsapp to Brain: {phone}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{BRAIN_URL}/execute",
                    json={
                        "function_name": "send_whatsapp",
                        "arguments": {"phone": phone, "message": message},
                    },
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    data = await resp.json()
                    result = data.get("result", data)
                    logger.info(f"Brain send_whatsapp result: {result}")
                    await params.result_callback(result)
        except Exception as e:
            logger.error(f"Brain send_whatsapp failed: {e}")
            await params.result_callback({"status": "failed", "error": str(e)})
    return handle


def register(llm):
    llm.register_function("send_whatsapp", create_handler())
