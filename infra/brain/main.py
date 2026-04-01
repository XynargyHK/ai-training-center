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
        "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
    }


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Brain starting on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
