"""
COMPACTION organ — summarizes conversation when memory gets full.
Like a meeting secretary who condenses 3-hour meeting into bullet points.
"""
from loguru import logger


def estimate_tokens(messages: list) -> int:
    total = 0
    for msg in messages:
        content = msg.get("content", "")
        cjk = sum(1 for c in content if '\u4e00' <= c <= '\u9fff')
        total += (cjk // 2) + ((len(content) - cjk) // 4) + 4
    return total


def should_compact(messages: list, max_tokens: int = 100000) -> bool:
    tokens = estimate_tokens(messages)
    return tokens > int(max_tokens * 0.8)


async def compact(messages: list, brain_think_fn) -> dict:
    """Summarize conversation into a structured state object.

    Args:
        messages: Full conversation history
        brain_think_fn: The brain.think function to call for summarization

    Returns:
        dict with 'summary' and 'key_facts'
    """
    if len(messages) < 4:
        return {"summary": "", "key_facts": []}

    conversation_text = "\n".join(f"{m['role']}: {m['content'][:200]}" for m in messages[-20:])

    result = await brain_think_fn(
        message=f"Summarize this conversation into key facts and decisions. Be brief:\n\n{conversation_text}",
        model="gemini-2.0-flash",
        system_prompt="You are a summarizer. Extract key facts, decisions, names, numbers, and action items. Return as bullet points.",
    )

    return {
        "summary": result.get("response", ""),
        "messages_compacted": len(messages),
        "tokens_before": estimate_tokens(messages),
    }
