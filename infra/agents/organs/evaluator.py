"""
EVALUATOR organ — self-scoring after each interaction.
Rates own performance on relevance, conciseness, helpfulness.
"""
from loguru import logger


async def evaluate(user_message: str, agent_response: str, brain_think_fn) -> dict:
    """Score a response using a separate LLM call as judge."""
    prompt = f"""Score this AI response 1-5 on: relevance, conciseness, helpfulness.
User: {user_message}
AI: {agent_response}
Return JSON: {{"relevance": N, "conciseness": N, "helpfulness": N, "overall": N}}"""

    result = await brain_think_fn(
        message=prompt,
        model="gemini-2.0-flash",  # cheap model for evaluation
        system_prompt="You are a quality evaluator. Return only JSON scores.",
    )

    try:
        import json
        scores = json.loads(result.get("response", "{}"))
        return scores
    except:
        return {"overall": 0, "error": "Could not parse scores"}
