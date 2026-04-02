"""
Google Calendar Tool — create/list/search events.
Uses Google Calendar API via service account or OAuth.
For now, uses the REST API with an API key for read, OAuth for write.
"""
import os
import aiohttp
from datetime import datetime, timedelta, timezone
from loguru import logger

# Google Calendar API
# Requires GOOGLE_CALENDAR_CREDENTIALS (service account JSON) or OAuth token
# For simplicity, we use the Gemini API key which also works for Calendar API
# if the Google Cloud project has Calendar API enabled.
GOOGLE_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY", "")
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")

# OAuth token for write operations (set via env or refresh flow)
GOOGLE_OAUTH_TOKEN = os.getenv("GOOGLE_OAUTH_TOKEN", "")


async def list_events(days_ahead: int = 7, max_results: int = 10) -> dict:
    """List upcoming calendar events."""
    now = datetime.now(timezone.utc).isoformat()
    future = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat()

    try:
        async with aiohttp.ClientSession() as session:
            params = {
                "timeMin": now,
                "timeMax": future,
                "maxResults": max_results,
                "singleEvents": "true",
                "orderBy": "startTime",
            }
            headers = {}
            if GOOGLE_OAUTH_TOKEN:
                headers["Authorization"] = f"Bearer {GOOGLE_OAUTH_TOKEN}"
                url = f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events"
            else:
                url = f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events?key={GOOGLE_API_KEY}"

            async with session.get(url, params=params, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json()
                if "error" in data:
                    return {"status": "failed", "error": data["error"].get("message", str(data["error"]))}

                events = []
                for item in data.get("items", []):
                    start = item.get("start", {}).get("dateTime", item.get("start", {}).get("date", ""))
                    end = item.get("end", {}).get("dateTime", item.get("end", {}).get("date", ""))
                    events.append({
                        "title": item.get("summary", "No title"),
                        "start": start,
                        "end": end,
                        "location": item.get("location", ""),
                        "description": item.get("description", "")[:200],
                    })
                return {"status": "ok", "events": events, "count": len(events)}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


async def create_event(title: str, start_time: str, end_time: str = "", duration_minutes: int = 60,
                       location: str = "", description: str = "", attendees: list = []) -> dict:
    """Create a calendar event.
    start_time: ISO format or natural like '2026-04-05T14:00:00+08:00'
    """
    if not GOOGLE_OAUTH_TOKEN:
        return {"status": "failed", "error": "Calendar write requires OAuth token. Set GOOGLE_OAUTH_TOKEN."}

    # Build end time if not provided
    if not end_time:
        try:
            start_dt = datetime.fromisoformat(start_time)
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            end_time = end_dt.isoformat()
        except:
            end_time = start_time  # fallback

    event_body = {
        "summary": title,
        "start": {"dateTime": start_time},
        "end": {"dateTime": end_time},
    }
    if location:
        event_body["location"] = location
    if description:
        event_body["description"] = description
    if attendees:
        event_body["attendees"] = [{"email": a} for a in attendees]

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events",
                headers={
                    "Authorization": f"Bearer {GOOGLE_OAUTH_TOKEN}",
                    "Content-Type": "application/json",
                },
                json=event_body,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                data = await resp.json()
                if "error" in data:
                    return {"status": "failed", "error": data["error"].get("message", str(data["error"]))}
                return {
                    "status": "created",
                    "title": title,
                    "start": start_time,
                    "end": end_time,
                    "link": data.get("htmlLink", ""),
                }
    except Exception as e:
        return {"status": "failed", "error": str(e)}


async def check_availability(date: str, time_from: str = "09:00", time_to: str = "18:00") -> dict:
    """Check if a time slot is free on a given date.
    date: YYYY-MM-DD
    """
    try:
        start = f"{date}T{time_from}:00+08:00"  # HKT default
        end = f"{date}T{time_to}:00+08:00"

        async with aiohttp.ClientSession() as session:
            headers = {}
            if GOOGLE_OAUTH_TOKEN:
                headers["Authorization"] = f"Bearer {GOOGLE_OAUTH_TOKEN}"
                url = f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events"
            else:
                url = f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events?key={GOOGLE_API_KEY}"

            async with session.get(url, params={
                "timeMin": start, "timeMax": end,
                "singleEvents": "true", "orderBy": "startTime",
            }, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                data = await resp.json()
                events = data.get("items", [])
                busy_slots = [{"title": e.get("summary", "Busy"), "start": e.get("start", {}).get("dateTime", "")} for e in events]
                return {
                    "status": "ok",
                    "date": date,
                    "busy_slots": busy_slots,
                    "is_free": len(busy_slots) == 0,
                    "summary": f"{'Free' if not busy_slots else f'{len(busy_slots)} events'} on {date} {time_from}-{time_to}",
                }
    except Exception as e:
        return {"status": "failed", "error": str(e)}
