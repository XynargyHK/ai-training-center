"""
Calendar Tool — send calendar invites via email (.ics).
No OAuth needed. Just email with .ics attachment.
Delegates to Brain /execute.
"""
import os
import aiohttp
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

BRAIN_URL = os.getenv("BRAIN_URL", "http://localhost:8000")

schema = FunctionSchema(
    name="send_calendar_invite",
    description="Send a calendar invite to someone via email. The event will appear in their Google/Outlook/Apple Calendar. Use when user says 'schedule a meeting', 'book dinner with John', 'send a calendar invite'.",
    properties={
        "title": {"type": "string", "description": "Event title, e.g. 'Dinner with John'"},
        "start_time": {"type": "string", "description": "Start time in ISO format, e.g. 2026-04-05T19:00:00+08:00"},
        "duration_minutes": {"type": "number", "description": "Duration in minutes. Default: 60"},
        "location": {"type": "string", "description": "Location (optional)"},
        "attendees": {"type": "string", "description": "Comma-separated email addresses to invite"},
    },
    required=["title", "start_time", "attendees"],
)

schemas = [schema]


def create_handler():
    async def handle(params: FunctionCallParams):
        title = params.arguments.get("title", "")
        start = params.arguments.get("start_time", "")
        duration = params.arguments.get("duration_minutes", 60)
        location = params.arguments.get("location", "")
        attendees_str = params.arguments.get("attendees", "")
        attendees = [a.strip() for a in attendees_str.split(",") if a.strip()]
        logger.info(f"Calendar: sending invite '{title}' to {attendees}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{BRAIN_URL}/execute",
                    json={"function_name": "send_calendar_invite", "arguments": {
                        "title": title, "start_time": start,
                        "duration_minutes": duration, "location": location,
                        "attendees": attendees,
                    }},
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    data = await resp.json()
                    await params.result_callback(data.get("result", data))
        except Exception as e:
            await params.result_callback({"status": "failed", "error": str(e)})
    return handle


def register(llm):
    llm.register_function("send_calendar_invite", create_handler())
