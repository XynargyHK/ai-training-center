"""
Secretary Batcher — Event-driven autonomy for the AI General Manager.
Accumulates events, batches them by priority, and delivers summaries.

Priority levels:
- immediate: alert NOW via WhatsApp (legal, security, complaints)
- briefing: batch 15 min → one summary message
- background: weekly digest only
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from loguru import logger
from memory import get_pending_events, mark_events_processed, queue_event
from functions import send_whatsapp
from brain import think
from config import WHATSAPP_GATEWAY_URL


# Default alert recipient (boss's WhatsApp)
BOSS_PHONE = os.getenv("BOSS_PHONE", "85294740952")
BATCH_INTERVAL_SECONDS = int(os.getenv("BATCH_INTERVAL", "900"))  # 15 min default


async def process_immediate_events():
    """Process high-priority events immediately — send WhatsApp alert NOW."""
    events = await get_pending_events(priority="immediate")
    if not events:
        return 0

    for event in events:
        content = event.get("content", {})
        event_type = event.get("event_type", "unknown")
        user_id = event.get("user_id", "unknown")

        # Compose alert message
        alert = f"⚠️ URGENT: {event_type}\n"
        alert += f"From: {user_id}\n"
        alert += f"Details: {content.get('summary', str(content)[:200])}\n"
        alert += f"Time: {event.get('created_at', 'now')}"

        # Send immediately via WhatsApp
        result = await send_whatsapp(BOSS_PHONE, alert)
        logger.info(f"Immediate alert sent: {event_type} → {result}")

    # Mark all as processed
    event_ids = [e["id"] for e in events]
    await mark_events_processed(event_ids)
    return len(events)


async def process_briefing_events():
    """Batch briefing events into one summary and deliver."""
    events = await get_pending_events(priority="briefing")
    if not events:
        return 0

    # Group events by type
    by_type = {}
    for event in events:
        etype = event.get("event_type", "other")
        if etype not in by_type:
            by_type[etype] = []
        by_type[etype].append(event)

    # Ask Brain to compose a natural briefing
    event_summary = []
    for etype, items in by_type.items():
        event_summary.append(f"- {len(items)} {etype} events")
        for item in items[:3]:  # Max 3 examples per type
            content = item.get("content", {})
            event_summary.append(f"  • {content.get('summary', str(content)[:100])}")

    briefing_request = f"Compose a brief WhatsApp summary for these events:\n" + "\n".join(event_summary)

    result = await think(
        message=briefing_request,
        conversation_history=[],
        user_context={"role": "secretary_batcher"},
    )

    briefing_text = f"📋 Briefing ({len(events)} events)\n\n{result.get('response', 'No summary available.')}"

    # Send briefing
    await send_whatsapp(BOSS_PHONE, briefing_text)

    # Mark all as processed
    batch_id = str(uuid.uuid4())[:8]
    event_ids = [e["id"] for e in events]
    await mark_events_processed(event_ids, batch_id=batch_id)

    logger.info(f"Briefing sent: {len(events)} events in batch {batch_id}")
    return len(events)


async def run_secretary_loop():
    """Main secretary loop — runs continuously, processes events by priority."""
    logger.info(f"Secretary Batcher started (interval: {BATCH_INTERVAL_SECONDS}s, boss: {BOSS_PHONE})")

    while True:
        try:
            # Always process immediate events first
            immediate_count = await process_immediate_events()
            if immediate_count:
                logger.info(f"Processed {immediate_count} immediate events")

            # Process briefing events on interval
            briefing_count = await process_briefing_events()
            if briefing_count:
                logger.info(f"Processed {briefing_count} briefing events")

            if not immediate_count and not briefing_count:
                logger.debug("Secretary: nothing to do")

        except Exception as e:
            logger.error(f"Secretary error: {e}")

        # Wait for next batch interval
        await asyncio.sleep(BATCH_INTERVAL_SECONDS)


async def morning_briefing():
    """Generate and send a morning briefing summary."""
    logger.info("Generating morning briefing...")

    result = await think(
        message="Generate a morning briefing. Check for any pending events, unread WhatsApp messages, or tasks that need attention today. Keep it concise.",
        conversation_history=[],
        user_context={"role": "morning_briefing"},
    )

    briefing = f"🌅 Good Morning Briefing\n\n{result.get('response', 'Nothing urgent today.')}"
    await send_whatsapp(BOSS_PHONE, briefing)
    logger.info("Morning briefing sent")
