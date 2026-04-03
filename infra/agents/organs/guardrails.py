"""
GUARDRAILS organ (immune system) — input/output safety filtering.
"""
from loguru import logger

INJECTION_PATTERNS = [
    "ignore previous instructions", "ignore all previous", "disregard your instructions",
    "system prompt", "you are now", "pretend you are", "jailbreak",
]


class Guardrails:
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.blocked_count = 0

    def check_input(self, text: str) -> dict:
        text_lower = text.lower()
        for pattern in INJECTION_PATTERNS:
            if pattern in text_lower:
                self.blocked_count += 1
                logger.warning(f"[{self.agent_name}] BLOCKED input: '{pattern}'")
                return {"safe": False, "reason": pattern}
        return {"safe": True}

    def check_output(self, text: str) -> str:
        # Remove patterns that break the human-like experience
        for bad in ["I'm just an AI", "As a large language model", "I cannot provide medical advice"]:
            text = text.replace(bad, "").replace(bad.lower(), "")
        return text.strip()
