"""
Calendar Tool — send calendar invites via email (.ics format).
No OAuth needed. Just send an email with .ics attachment.
Works with Google Calendar, Outlook, Apple Calendar — any email client.
"""
import os
import uuid
from datetime import datetime, timedelta
import aiohttp
from loguru import logger

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("CALENDAR_FROM_EMAIL", "sarah@aistaffs.app")


def generate_ics(title: str, start_time: str, duration_minutes: int = 60,
                 location: str = "", description: str = "", organizer_email: str = "",
                 attendees: list = []) -> str:
    """Generate .ics calendar file content."""
    uid = str(uuid.uuid4())
    now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    # Parse start time
    try:
        start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
    except:
        start_dt = datetime.utcnow() + timedelta(hours=1)

    end_dt = start_dt + timedelta(minutes=duration_minutes)

    dtstart = start_dt.strftime("%Y%m%dT%H%M%S")
    dtend = end_dt.strftime("%Y%m%dT%H%M%S")

    # Build attendee lines
    attendee_lines = ""
    for email in attendees:
        attendee_lines += f"ATTENDEE;RSVP=TRUE:mailto:{email}\n"

    ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Staffs//Sarah AI//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:{uid}
DTSTART:{dtstart}
DTEND:{dtend}
DTSTAMP:{now}
SUMMARY:{title}
LOCATION:{location}
DESCRIPTION:{description}
{f'ORGANIZER:mailto:{organizer_email}' if organizer_email else ''}
{attendee_lines}STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""
    return ics.strip()


async def send_calendar_invite(title: str, start_time: str, duration_minutes: int = 60,
                                location: str = "", description: str = "",
                                attendees: list = []) -> dict:
    """Send a calendar invite to attendees via email with .ics attachment."""
    if not attendees:
        return {"status": "failed", "error": "No attendees provided"}

    if not RESEND_API_KEY:
        return {"status": "failed", "error": "RESEND_API_KEY not configured"}

    ics_content = generate_ics(
        title=title,
        start_time=start_time,
        duration_minutes=duration_minutes,
        location=location,
        description=description,
        organizer_email=FROM_EMAIL,
        attendees=attendees,
    )

    # Parse time for email body
    try:
        start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        time_str = start_dt.strftime("%B %d, %Y at %I:%M %p")
    except:
        time_str = start_time

    import base64
    ics_b64 = base64.b64encode(ics_content.encode()).decode()

    logger.info(f"Calendar invite: '{title}' at {time_str} to {attendees}")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": f"Sarah AI <{FROM_EMAIL}>",
                    "to": attendees,
                    "subject": f"Calendar Invite: {title}",
                    "html": f"""
                        <h2>{title}</h2>
                        <p><strong>When:</strong> {time_str}</p>
                        <p><strong>Duration:</strong> {duration_minutes} minutes</p>
                        {f'<p><strong>Location:</strong> {location}</p>' if location else ''}
                        {f'<p>{description}</p>' if description else ''}
                        <p><em>Sent by Sarah AI Assistant</em></p>
                    """,
                    "attachments": [{
                        "filename": "invite.ics",
                        "content": ics_b64,
                        "content_type": "text/calendar",
                    }],
                },
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                data = await resp.json()
                if resp.status in (200, 201):
                    return {
                        "status": "sent",
                        "title": title,
                        "time": time_str,
                        "attendees": attendees,
                        "summary": f"Calendar invite '{title}' sent to {', '.join(attendees)}",
                    }
                else:
                    return {"status": "failed", "error": str(data)}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
