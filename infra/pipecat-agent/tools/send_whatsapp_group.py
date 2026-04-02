"""
Send WhatsApp Group Tool — delegates to Brain.
Input: group_name, message, optional media_url/media_type
Output: status
"""
import os
import aiohttp
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

BRAIN_URL = os.getenv("BRAIN_URL", "http://localhost:8000")

schema = FunctionSchema(
    name="send_whatsapp_group",
    description="Send a message to a WhatsApp group. Use when user says 'message the group', 'send to our travel group', 'tell the group chat'.",
    properties={
        "group_name": {
            "type": "string",
            "description": "Group name to search for"
        },
        "message": {
            "type": "string",
            "description": "Message text to send"
        },
    },
    required=["group_name", "message"],
)


def create_handler():
    async def handle(params: FunctionCallParams):
        group_name = params.arguments.get("group_name", "")
        message = params.arguments.get("message", "")
        logger.info(f"Delegating send_whatsapp_group to Brain: {group_name}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{BRAIN_URL}/execute",
                    json={
                        "function_name": "send_whatsapp_group",
                        "arguments": {"group_name": group_name, "message": message},
                    },
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    data = await resp.json()
                    await params.result_callback(data.get("result", data))
        except Exception as e:
            logger.error(f"Brain send_whatsapp_group failed: {e}")
            await params.result_callback({"status": "failed", "error": str(e)})
    return handle


def register(llm):
    llm.register_function("send_whatsapp_group", create_handler())
