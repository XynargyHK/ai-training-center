"""
Brain memory module — manages soul facts, session insights, and state objects.
Uses Supabase for persistent storage across sessions and channels.
"""
import os
import json
from datetime import datetime, timezone, timedelta
from loguru import logger

# Supabase client
from supabase import create_client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


# ============================================================
# SOUL FACTS — Permanent knowledge about contacts/entities
# ============================================================

async def store_soul_fact(
    user_id: str,
    business_unit_id: str,
    entity_type: str,
    entity_key: str,
    content: str,
    source: str = "conversation",
) -> dict:
    """Store a permanent fact in the soul. Append-only with versioning."""
    if not supabase:
        return {"error": "Supabase not configured"}

    # Check if this entity_key already exists (for versioning)
    query = supabase.table("brain_soul").select("id, version").eq(
        "user_id", user_id
    ).eq("entity_key", entity_key).eq("is_active", True)
    if business_unit_id:
        query = query.eq("business_unit_id", business_unit_id)
    else:
        query = query.is_("business_unit_id", "null")
    existing = query.execute()

    version = 1
    if existing.data:
        # Deactivate old version
        old_id = existing.data[0]["id"]
        version = existing.data[0]["version"] + 1
        supabase.table("brain_soul").update({"is_active": False}).eq("id", old_id).execute()

    # Insert new version
    row = {
        "user_id": user_id,
        "entity_type": entity_type,
        "entity_key": entity_key,
        "content": content,
        "source": source,
        "version": version,
    }
    if business_unit_id:
        row["business_unit_id"] = business_unit_id
    result = supabase.table("brain_soul").insert(row).execute()

    logger.info(f"Soul fact stored: {entity_type}/{entity_key} v{version}")
    return {"stored": True, "version": version}


async def get_soul_facts(user_id: str, business_unit_id: str, entity_type: str = None, limit: int = 20) -> list:
    """Retrieve active soul facts for a user."""
    if not supabase:
        return []

    query = supabase.table("brain_soul").select("*").eq(
        "user_id", user_id
    ).eq("is_active", True)
    if business_unit_id:
        query = query.eq("business_unit_id", business_unit_id)
    else:
        query = query.is_("business_unit_id", "null")

    if entity_type:
        query = query.eq("entity_type", entity_type)

    result = query.order("created_at", desc=True).limit(limit).execute()
    return result.data or []


# ============================================================
# SESSION INSIGHTS — Auto-summaries after conversations
# ============================================================

async def store_session_insight(
    session_id: str,
    user_id: str,
    business_unit_id: str,
    channel: str,
    summary: str,
    key_topics: list = None,
    action_items: list = None,
    emotional_tone: str = "neutral",
) -> dict:
    """Store a session insight (auto-summary)."""
    if not supabase:
        return {"error": "Supabase not configured"}

    result = supabase.table("session_insights").insert({
        "session_id": session_id,
        "user_id": user_id,
        "business_unit_id": business_unit_id,
        "channel": channel,
        "summary": summary,
        "key_topics": key_topics or [],
        "action_items": action_items or [],
        "emotional_tone": emotional_tone,
    }).execute()

    logger.info(f"Session insight stored: {channel} | {summary[:50]}...")
    return {"stored": True}


async def get_recent_insights(user_id: str, business_unit_id: str, limit: int = 10) -> list:
    """Get recent session insights for context loading."""
    if not supabase:
        return []

    result = supabase.table("session_insights").select("*").eq(
        "user_id", user_id
    ).eq("business_unit_id", business_unit_id).order(
        "created_at", desc=True
    ).limit(limit).execute()

    return result.data or []


# ============================================================
# STATE OBJECTS — JSON snapshots for conversation compaction
# ============================================================

async def save_state_object(
    session_id: str,
    user_id: str,
    business_unit_id: str,
    state: dict,
    messages_compacted: int = 0,
    tokens_before: int = 0,
    tokens_after: int = 0,
) -> dict:
    """Save a JSON state object for conversation compaction."""
    if not supabase:
        return {"error": "Supabase not configured"}

    # Get current version
    existing = supabase.table("brain_state_objects").select("version").eq(
        "session_id", session_id
    ).order("version", desc=True).limit(1).execute()

    version = (existing.data[0]["version"] + 1) if existing.data else 1

    result = supabase.table("brain_state_objects").insert({
        "session_id": session_id,
        "user_id": user_id,
        "business_unit_id": business_unit_id,
        "version": version,
        "state": state,
        "messages_compacted": messages_compacted,
        "tokens_before": tokens_before,
        "tokens_after": tokens_after,
    }).execute()

    logger.info(f"State object v{version} saved for session {session_id[:20]}...")
    return {"version": version}


async def get_latest_state_object(session_id: str) -> dict | None:
    """Get the latest state object for a session."""
    if not supabase:
        return None

    result = supabase.table("brain_state_objects").select("*").eq(
        "session_id", session_id
    ).order("version", desc=True).limit(1).execute()

    return result.data[0] if result.data else None


# ============================================================
# PENDING INTELLIGENCE — Event queue for Secretary Batcher
# ============================================================

async def queue_event(
    business_unit_id: str,
    user_id: str,
    event_type: str,
    content: dict,
    priority: str = "briefing",
) -> dict:
    """Queue an event for the Secretary Batcher."""
    if not supabase:
        return {"error": "Supabase not configured"}

    result = supabase.table("pending_intelligence").insert({
        "business_unit_id": business_unit_id,
        "user_id": user_id,
        "event_type": event_type,
        "priority": priority,
        "content": content,
    }).execute()

    logger.info(f"Event queued: {event_type} ({priority}) for {user_id}")
    return {"queued": True}


async def get_pending_events(priority: str = None, limit: int = 50) -> list:
    """Get unprocessed events from the queue."""
    if not supabase:
        return []

    query = supabase.table("pending_intelligence").select("*").eq("is_processed", False)

    if priority:
        query = query.eq("priority", priority)

    result = query.order("created_at", desc=False).limit(limit).execute()
    return result.data or []


async def mark_events_processed(event_ids: list, batch_id: str = None) -> int:
    """Mark events as processed."""
    if not supabase or not event_ids:
        return 0

    update_data = {"is_processed": True, "processed_at": datetime.now(timezone.utc).isoformat()}
    if batch_id:
        update_data["batch_id"] = batch_id

    for eid in event_ids:
        supabase.table("pending_intelligence").update(update_data).eq("id", eid).execute()

    return len(event_ids)


# ============================================================
# CONTACT LANGUAGE — Per-contact language preference
# ============================================================

async def get_contact_language(phone: str) -> str | None:
    """Get stored language preference for a contact."""
    if not supabase:
        return None

    result = supabase.table("customer_profiles").select(
        "preferred_language"
    ).eq("phone", phone).limit(1).execute()

    if result.data:
        return result.data[0].get("preferred_language")
    return None


async def set_contact_language(phone: str, language: str, detected_from: str = "auto") -> dict:
    """Store language preference for a contact."""
    if not supabase:
        return {"error": "Supabase not configured"}

    # Try update existing
    result = supabase.table("customer_profiles").update({
        "preferred_language": language,
        "language_detected_from": detected_from,
        "language_confirmed": detected_from == "user_explicit",
    }).eq("phone", phone).execute()

    if not result.data:
        # Insert new profile
        supabase.table("customer_profiles").insert({
            "phone": phone,
            "preferred_language": language,
            "language_detected_from": detected_from,
        }).execute()

    logger.info(f"Contact language set: {phone} → {language} (from: {detected_from})")
    return {"stored": True, "language": language}
