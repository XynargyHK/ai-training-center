"""
Schedule WhatsApp Tool — delegates to Brain.
Input: phone, message, delay_minutes
Output: status, summary
"""
import os
import aiohttp
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

BRAIN_URL = os.getenv("BRAIN_URL", "http://localhost:8000")

schema = FunctionSchema(
    name="schedule_whatsapp",
    description="Schedule a WhatsApp message to be sent later. Use when user says 'send this message tomorrow at 9am', 'remind John at 6pm', 'schedule a message'.",
    properties={
        "phone": {
            "type": "string",
            "description": "Phone number with country code, e.g. 85296099766"
        },
        "message": {
            "type": "string",
            "description": "Message text to send"
        },
        "delay_minutes": {
            "type": "number",
            "description": "Minutes from now to send. E.g. 60 for 1 hour, 1440 for 24 hours"
        },
    },
    required=["phone", "message", "delay_minutes"],
)


def create_handler():
    async def handle(params: FunctionCallParams):
        phone = params.arguments.get("phone", "")
        message = params.arguments.get("message", "")
        delay = params.arguments.get("delay_minutes", 60)
        logger.info(f"Delegating schedule_whatsapp to Brain: {phone} in {delay}min")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{BRAIN_URL}/execute",
                    json={
                        "function_name": "schedule_whatsapp",
                        "arguments": {"phone": phone, "message": message, "delay_minutes": delay},
                    },
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    data = await resp.json()
                    await params.result_callback(data.get("result", data))
        except Exception as e:
            logger.error(f"Brain schedule_whatsapp failed: {e}")
            await params.result_callback({"status": "failed", "error": str(e)})
    return handle


def register(llm):
    llm.register_function("schedule_whatsapp", create_handler())
