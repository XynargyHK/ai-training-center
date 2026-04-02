"""
Evaluator — LLM-as-Judge for response quality.
Scores AI responses on relevance, accuracy, helpfulness.
Can be run as batch evaluation or per-session.
"""
import os
from loguru import logger

GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY", "")


async def evaluate_response(user_message: str, ai_response: str, context: str = "") -> dict:
    """Score an AI response using Gemini as judge.
    Returns scores 1-5 on multiple dimensions."""
    import aiohttp

    judge_prompt = f"""You are an AI quality evaluator. Score the following AI response on a scale of 1-5 for each dimension.

User message: {user_message}
AI response: {ai_response}
{f'Context: {context}' if context else ''}

Score each dimension (1=terrible, 5=perfect):
1. Relevance: Does the response answer what the user asked?
2. Conciseness: Is it appropriately brief for voice? (1-2 sentences ideal)
3. Helpfulness: Does it provide actionable value?
4. Naturalness: Does it sound like a human speaking? (not robotic)
5. Accuracy: Is the information correct? (if verifiable)

Respond in JSON only: {{"relevance": N, "conciseness": N, "helpfulness": N, "naturalness": N, "accuracy": N, "overall": N, "note": "brief comment"}}"""

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": judge_prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                },
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                data = await resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                import json
                scores = json.loads(text)
                logger.info(f"[EVAL] Overall: {scores.get('overall', '?')}/5 | {scores.get('note', '')}")
                return scores
    except Exception as e:
        logger.error(f"Evaluation failed: {e}")
        return {"error": str(e)}


async def evaluate_session(messages: list) -> dict:
    """Evaluate an entire session. Returns average scores."""
    scores_list = []
    for i in range(len(messages) - 1):
        if messages[i].get("role") == "user" and messages[i + 1].get("role") in ("assistant", "model"):
            score = await evaluate_response(
                messages[i]["content"],
                messages[i + 1]["content"],
            )
            if "error" not in score:
                scores_list.append(score)

    if not scores_list:
        return {"error": "No evaluable turns"}

    # Average scores
    dims = ["relevance", "conciseness", "helpfulness", "naturalness", "accuracy", "overall"]
    avg = {}
    for dim in dims:
        values = [s.get(dim, 0) for s in scores_list if isinstance(s.get(dim), (int, float))]
        avg[dim] = round(sum(values) / len(values), 2) if values else 0

    avg["turns_evaluated"] = len(scores_list)
    return avg
