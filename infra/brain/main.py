"""
Brain container — FastAPI service for AI thinking + function execution + vision.
The Brain receives requests from Pipecat (Mouth) and returns intelligent responses.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger

from brain import think
from vision import analyze_image
from config import PORT

app = FastAPI(title="AI Brain", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================
class ThinkRequest(BaseModel):
    message: str
    conversation_history: list = []
    user_context: dict = {}


class ThinkResponse(BaseModel):
    response: str
    actions_taken: list = []
    client_actions: list = []


class VisionRequest(BaseModel):
    image_base64: str
    question: str = ""
    lang: str = "en"


class VisionResponse(BaseModel):
    description: str


# ============================================================
# ENDPOINTS
# ============================================================
@app.post("/think", response_model=ThinkResponse)
async def think_endpoint(req: ThinkRequest):
    """Main Brain endpoint — receives message, thinks, executes functions, returns response."""
    result = await think(
        message=req.message,
        conversation_history=req.conversation_history,
        user_context=req.user_context,
    )
    return ThinkResponse(**result)


@app.post("/vision", response_model=VisionResponse)
async def vision_endpoint(req: VisionRequest):
    """Vision endpoint — analyze an image and return description."""
    result = await analyze_image(
        image_base64=req.image_base64,
        question=req.question,
        lang=req.lang,
    )
    return VisionResponse(**result)


@app.get("/health")
async def health():
    """Health check."""
    from functions import FUNCTION_REGISTRY
    return {
        "status": "ok",
        "service": "brain",
        "functions": len(FUNCTION_REGISTRY),
        "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    }


# ============================================================
# MEMORY ENDPOINTS
# ============================================================
class RememberRequest(BaseModel):
    user_id: str
    business_unit_id: str
    entity_type: str = "fact"
    entity_key: str
    content: str
    source: str = "user_explicit"


class EventRequest(BaseModel):
    business_unit_id: str
    user_id: str
    event_type: str
    content: dict
    priority: str = "briefing"


@app.post("/remember")
async def remember_endpoint(req: RememberRequest):
    """Store a permanent fact in the soul."""
    from memory import store_soul_fact
    result = await store_soul_fact(
        user_id=req.user_id,
        business_unit_id=req.business_unit_id,
        entity_type=req.entity_type,
        entity_key=req.entity_key,
        content=req.content,
        source=req.source,
    )
    return result


@app.post("/event")
async def event_endpoint(req: EventRequest):
    """Queue an event for the Secretary Batcher."""
    from memory import queue_event
    result = await queue_event(
        business_unit_id=req.business_unit_id,
        user_id=req.user_id,
        event_type=req.event_type,
        content=req.content,
        priority=req.priority,
    )
    return result


@app.get("/soul/{user_id}")
async def get_soul_endpoint(user_id: str, business_unit_id: str = ""):
    """Get soul facts for a user."""
    from memory import get_soul_facts
    facts = await get_soul_facts(user_id, business_unit_id)
    return {"facts": facts, "count": len(facts)}


@app.get("/insights/{user_id}")
async def get_insights_endpoint(user_id: str, business_unit_id: str = "", limit: int = 10):
    """Get recent session insights for a user."""
    from memory import get_recent_insights
    insights = await get_recent_insights(user_id, business_unit_id, limit)
    return {"insights": insights, "count": len(insights)}


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Brain starting on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
