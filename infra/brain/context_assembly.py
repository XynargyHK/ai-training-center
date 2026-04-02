"""
Context Assembly Pipeline — pre-flight token estimation + overflow detection.
Before every LLM call, estimates token count and prunes if needed.
From OpenClaw comparison: their 10-step pipeline, simplified.
"""
from loguru import logger

# Rough token estimation: 1 token ≈ 4 chars for English, 2 chars for CJK
def estimate_tokens(text: str) -> int:
    cjk_count = sum(1 for c in text if '\u4e00' <= c <= '\u9fff' or '\u3000' <= c <= '\u303f')
    non_cjk = len(text) - cjk_count
    return (cjk_count // 2) + (non_cjk // 4)


def estimate_messages_tokens(messages: list) -> int:
    total = 0
    for msg in messages:
        content = msg.get("content", "")
        if isinstance(content, str):
            total += estimate_tokens(content)
        total += 4  # message overhead
    return total


def should_compact(messages: list, max_tokens: int = 100000) -> bool:
    """Check if conversation is at 80% capacity and needs compaction."""
    tokens = estimate_messages_tokens(messages)
    threshold = int(max_tokens * 0.8)
    if tokens > threshold:
        logger.warning(f"Context at {tokens}/{max_tokens} tokens ({tokens*100//max_tokens}%) — compaction needed")
        return True
    return False


def truncate_tool_result(result: dict, max_chars: int = 2000) -> dict:
    """Truncate tool results that are too large. Prevents token waste."""
    truncated = {}
    for key, value in result.items():
        if isinstance(value, str) and len(value) > max_chars:
            truncated[key] = value[:500] + f"\n...[truncated {len(value) - 1000} chars]...\n" + value[-500:]
            logger.info(f"Truncated tool result '{key}': {len(value)} -> {max_chars} chars")
        else:
            truncated[key] = value
    return truncated
