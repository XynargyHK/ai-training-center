"""
Calendar Tools — list events, create events, check availability.
Delegates to Brain /execute.
"""
import os
import aiohttp
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams

BRAIN_URL = os.getenv("BRAIN_URL", "http://localhost:8000")

list_events_schema = FunctionSchema(
    name="list_calendar_events",
    description="List upcoming calendar events. Use when user asks 'what's on my schedule', 'any meetings today', 'what do I have this week'.",
    properties={
        "days_ahead": {"type": "number", "description": "Number of days to look ahead. Default: 7"},
    },
    required=[],
)

create_event_schema = FunctionSchema(
    name="create_calendar_event",
    description="Create a calendar event. Use when user says 'schedule a meeting', 'add to my calendar', 'book lunch at 1pm'.",
    properties={
        "title": {"type": "string", "description": "Event title"},
        "start_time": {"type": "string", "description": "Start time in ISO format, e.g. 2026-04-05T14:00:00+08:00"},
        "duration_minutes": {"type": "number", "description": "Duration in minutes. Default: 60"},
        "location": {"type": "string", "description": "Location (optional)"},
        "attendees": {"type": "string", "description": "Comma-separated email addresses (optional)"},
    },
    required=["title", "start_time"],
)

check_availability_schema = FunctionSchema(
    name="check_calendar_availability",
    description="Check if a time slot is free. Use when user asks 'am I free on Friday', 'is 2pm available'.",
    properties={
        "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
        "time_from": {"type": "string", "description": "Start time HH:MM. Default: 09:00"},
        "time_to": {"type": "string", "description": "End time HH:MM. Default: 18:00"},
    },
    required=["date"],
)


async def _call_brain(function_name: str, arguments: dict) -> dict:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BRAIN_URL}/execute",
                json={"function_name": function_name, "arguments": arguments},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                data = await resp.json()
                return data.get("result", data)
    except Exception as e:
        return {"status": "failed", "error": str(e)}


def create_list_handler():
    async def handle(params: FunctionCallParams):
        days = params.arguments.get("days_ahead", 7)
        logger.info(f"Calendar: listing events {days} days ahead")
        result = await _call_brain("list_calendar_events", {"days_ahead": days})
        await params.result_callback(result)
    return handle


def create_create_handler():
    async def handle(params: FunctionCallParams):
        title = params.arguments.get("title", "")
        start = params.arguments.get("start_time", "")
        duration = params.arguments.get("duration_minutes", 60)
        location = params.arguments.get("location", "")
        attendees_str = params.arguments.get("attendees", "")
        attendees = [a.strip() for a in attendees_str.split(",") if a.strip()] if attendees_str else []
        logger.info(f"Calendar: creating event '{title}' at {start}")
        result = await _call_brain("create_calendar_event", {
            "title": title, "start_time": start, "duration_minutes": duration,
            "location": location, "attendees": attendees,
        })
        await params.result_callback(result)
    return handle


def create_check_handler():
    async def handle(params: FunctionCallParams):
        date = params.arguments.get("date", "")
        time_from = params.arguments.get("time_from", "09:00")
        time_to = params.arguments.get("time_to", "18:00")
        logger.info(f"Calendar: checking availability {date} {time_from}-{time_to}")
        result = await _call_brain("check_calendar_availability", {
            "date": date, "time_from": time_from, "time_to": time_to,
        })
        await params.result_callback(result)
    return handle


schemas = [list_events_schema, create_event_schema, check_availability_schema]


def register(llm):
    llm.register_function("list_calendar_events", create_list_handler())
    llm.register_function("create_calendar_event", create_create_handler())
    llm.register_function("check_calendar_availability", create_check_handler())
