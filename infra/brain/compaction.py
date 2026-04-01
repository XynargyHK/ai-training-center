"""
Brain compaction — JSON State Object for conversation compression.
When conversation exceeds context limit, create a structured snapshot
and start fresh with the state object.
"""
from loguru import logger
from google import genai
from google.genai import types
from config import GOOGLE_GEMINI_API_KEY, GEMINI_MODEL

client = genai.Client(api_key=GOOGLE_GEMINI_API_KEY)

COMPACTION_PROMPT = """Analyze this conversation and create a JSON State Object that captures everything important.

The state object must include:
- goals: what the user is trying to accomplish
- unresolved_tasks: things still pending or in progress
- decisions_made: key decisions from this conversation
- user_state: mood, preferences, context (location, time pressure, etc.)
- key_facts: important information mentioned (names, numbers, dates)
- last_topic: what was being discussed most recently

Return ONLY valid JSON, no markdown, no explanation:
{
    "goals": ["..."],
    "unresolved_tasks": ["..."],
    "decisions_made": ["..."],
    "user_state": {"mood": "...", "context": "..."},
    "key_facts": ["..."],
    "last_topic": "..."
}

CONVERSATION TO COMPACT:
"""


async def compact_conversation(messages: list) -> dict:
    """Compact a conversation into a JSON State Object.

    Args:
        messages: list of {"role": "user/assistant", "content": "..."} dicts

    Returns:
        dict with 'state_object' (the JSON) and 'summary' (readable text)
    """
    if not messages:
        return {"state_object": {}, "summary": "Empty conversation"}

    # Build conversation text
    conv_text = "\n".join([
        f"{'User' if m.get('role') == 'user' else 'AI'}: {m.get('content', '')}"
        for m in messages
    ])

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[{"text": COMPACTION_PROMPT + conv_text}],
            config=types.GenerateContentConfig(
                temperature=0.1,  # Low temperature for accuracy
            ),
        )

        text = response.text.strip()
        # Clean up markdown if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        import json
        state_object = json.loads(text)

        # Create readable summary
        summary_parts = []
        if state_object.get("goals"):
            summary_parts.append(f"Goals: {', '.join(state_object['goals'][:3])}")
        if state_object.get("last_topic"):
            summary_parts.append(f"Last topic: {state_object['last_topic']}")
        if state_object.get("unresolved_tasks"):
            summary_parts.append(f"Pending: {', '.join(state_object['unresolved_tasks'][:3])}")

        summary = ". ".join(summary_parts) if summary_parts else "Conversation compacted."

        logger.info(f"Compacted {len(messages)} messages into state object")
        return {
            "state_object": state_object,
            "summary": summary,
            "messages_compacted": len(messages),
        }

    except Exception as e:
        logger.error(f"Compaction failed: {e}")
        # Fallback: simple last-message summary
        last_messages = messages[-3:] if len(messages) >= 3 else messages
        fallback_summary = " | ".join([m.get("content", "")[:100] for m in last_messages])
        return {
            "state_object": {"last_topic": fallback_summary, "error": "compaction_failed"},
            "summary": f"Compaction failed, keeping last {len(last_messages)} messages.",
            "messages_compacted": 0,
        }


def estimate_tokens(text: str) -> int:
    """Rough token estimation (1 token ≈ 4 chars for English)."""
    return len(text) // 4


def should_compact(messages: list, max_tokens: int = 100000) -> bool:
    """Check if conversation needs compaction (at 80% of context limit)."""
    total_text = " ".join([m.get("content", "") for m in messages])
    estimated = estimate_tokens(total_text)
    threshold = int(max_tokens * 0.8)

    if estimated > threshold:
        logger.info(f"Compaction needed: ~{estimated} tokens > {threshold} threshold")
        return True
    return False
