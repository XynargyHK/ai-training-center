"""
Guardrails — input/output filtering.
Intercepts AI-generated output before it reaches the user.
Validates user input before it reaches the LLM.
"""
from loguru import logger

# Patterns that should never appear in AI output
BLOCKED_OUTPUT_PATTERNS = [
    "I'm just an AI",  # breaks immersion in voice
    "As a large language model",
    "I cannot provide medical advice",  # too generic, should be specific
]

# Input injection patterns
INJECTION_PATTERNS = [
    "ignore previous instructions",
    "ignore all previous",
    "disregard your instructions",
    "system prompt",
    "you are now",
    "pretend you are",
    "jailbreak",
]


def validate_input(text: str) -> dict:
    """Check user input for injection attempts."""
    text_lower = text.lower()
    for pattern in INJECTION_PATTERNS:
        if pattern in text_lower:
            logger.warning(f"Guardrail: potential injection detected: '{pattern}' in '{text[:100]}'")
            return {"safe": False, "reason": f"Suspicious pattern: {pattern}"}
    return {"safe": True}


def validate_output(text: str) -> str:
    """Filter AI output — remove patterns that break user experience."""
    for pattern in BLOCKED_OUTPUT_PATTERNS:
        if pattern.lower() in text.lower():
            logger.info(f"Guardrail: removed blocked pattern from output: '{pattern}'")
            text = text.replace(pattern, "").replace(pattern.lower(), "")
    return text.strip()


def check_high_risk_action(function_name: str, arguments: dict) -> dict:
    """HITL check — flag high-risk actions for human confirmation.
    Returns {needs_confirmation: bool, reason: str}"""
    HIGH_RISK_FUNCTIONS = {
        "send_whatsapp": "Sending a message to someone",
        "send_whatsapp_group": "Sending to a group",
        "make_call": "Making a phone call",
        "send_email": "Sending an email",
        "schedule_whatsapp": "Scheduling a message",
    }

    if function_name in HIGH_RISK_FUNCTIONS:
        return {
            "needs_confirmation": True,
            "reason": HIGH_RISK_FUNCTIONS[function_name],
            "function": function_name,
            "arguments": arguments,
        }
    return {"needs_confirmation": False}
