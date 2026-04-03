"""
BRAIN organ — LLM call wrapper.
Supports any provider (Gemini, Claude, OpenAI, Cerebras, local).
Each agent can use different LLMs for different task types.
"""
import os
import aiohttp
from loguru import logger


# LLM provider endpoints
PROVIDERS = {
    "gemini-2.0-flash": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        "key_env": "GOOGLE_GEMINI_API_KEY",
    },
    "gemini-2.5-flash": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        "key_env": "GOOGLE_GEMINI_API_KEY",
    },
    "gemini-2.5-pro": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
        "key_env": "GOOGLE_GEMINI_API_KEY",
    },
}


async def think(message: str, model: str = "gemini-2.5-flash", system_prompt: str = "",
                conversation_history: list = [], tools: list = []) -> dict:
    """Send a message to the LLM and get a response.

    Args:
        message: User's message
        model: LLM model name
        system_prompt: System/soul instructions
        conversation_history: Previous messages for context
        tools: Available function declarations

    Returns:
        dict with 'response' text and optional 'function_calls'
    """
    provider = PROVIDERS.get(model)
    if not provider:
        return {"response": f"Unknown model: {model}", "error": True}

    api_key = os.getenv(provider["key_env"], "")
    if not api_key:
        return {"response": f"Missing API key for {model}", "error": True}

    # Build contents
    contents = []
    for msg in conversation_history:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    body = {"contents": contents}
    if system_prompt:
        body["systemInstruction"] = {"parts": [{"text": system_prompt}]}
    if tools:
        body["tools"] = tools

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{provider['url']}?key={api_key}",
                json=body,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                data = await resp.json()

                if "error" in data:
                    return {"response": data["error"].get("message", str(data["error"])), "error": True}

                # Extract response
                candidates = data.get("candidates", [])
                if not candidates:
                    return {"response": "No response from LLM", "error": True}

                parts = candidates[0].get("content", {}).get("parts", [])
                text_parts = [p["text"] for p in parts if "text" in p]
                func_calls = [p["functionCall"] for p in parts if "functionCall" in p]

                return {
                    "response": " ".join(text_parts) if text_parts else "",
                    "function_calls": func_calls,
                    "usage": data.get("usageMetadata", {}),
                }
    except Exception as e:
        logger.error(f"Brain.think failed: {e}")
        return {"response": f"Brain error: {e}", "error": True}
