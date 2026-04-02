"""
Session Logger — spare part.
After a voice call ends, sends conversation to Brain for:
1. Session summary extraction
2. Cross-channel memory (WhatsApp knows what happened on voice)
3. Level 1 logging

Fire-and-forget: user never waits.
"""
import os
import aiohttp
from loguru import logger

BRAIN_URL = os.getenv("BRAIN_URL", "http://localhost:8000")


async def log_session(messages: list, session_id: str = "", user_phone: str = "", lang: str = "en"):
    """Send completed conversation to Brain for storage.
    Called when participant leaves the call. Non-blocking."""
    if not messages or len(messages) < 2:
        return  # No meaningful conversation

    # Filter to just user/assistant messages (skip system)
    conversation = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role in ("user", "assistant", "model") and content:
            conversation.append({"role": role, "content": content[:500]})

    if len(conversation) < 2:
        return

    logger.info(f"Session logger: sending {len(conversation)} messages to Brain")
    try:
        async with aiohttp.ClientSession() as session:
            # 1. Send to Brain /compact for session summary
            await session.post(
                f"{BRAIN_URL}/compact",
                json={
                    "messages": conversation,
                    "session_id": session_id,
                    "user_id": user_phone or "voice_user",
                },
                timeout=aiohttp.ClientTimeout(total=10),
            )
            logger.info("Session summary sent to Brain")

            # 2. Send event to Brain secretary batcher
            await session.post(
                f"{BRAIN_URL}/event",
                json={
                    "business_unit_id": "",
                    "user_id": user_phone or "voice_user",
                    "event_type": "voice_session_ended",
                    "content": {
                        "messages_count": len(conversation),
                        "lang": lang,
                        "last_message": conversation[-1].get("content", "")[:200],
                    },
                    "priority": "background",
                },
                timeout=aiohttp.ClientTimeout(total=5),
            )
            logger.info("Session event queued in Brain")
    except Exception as e:
        logger.warning(f"Session logger failed (non-fatal): {e}")
