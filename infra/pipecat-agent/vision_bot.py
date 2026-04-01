"""
Pipecat Voice + Vision AI Agent
Based on official pipecat gemini-live-video.py example.
Uses: GeminiLiveLLMService — audio + video in one service, server-side VAD.
"""
import asyncio
import os
import sys

from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService

try:
    from pipecat.transports.daily.transport import DailyParams, DailyTransport
except ImportError:
    from pipecat.transports.services.daily import DailyParams, DailyTransport

from loguru import logger

try:
    logger.remove(0)
except ValueError:
    pass
logger.add(sys.stderr, level="DEBUG")


async def main():
    room_url = os.getenv("DAILY_ROOM_URL")
    daily_api_key = os.getenv("DAILY_API_KEY")

    if not room_url:
        logger.error("DAILY_ROOM_URL not set")
        return

    # --- Transport: Daily WebRTC with video input ---
    # No local VAD — GeminiLive handles VAD server-side
    transport = DailyTransport(
        room_url,
        None,
        "AI Vision Assistant",
        DailyParams(
            api_key=daily_api_key,
            audio_in_enabled=True,
            audio_out_enabled=True,
            video_in_enabled=True,
        ),
    )

    # --- LLM: Gemini Multimodal Live ---
    from datetime import datetime, timezone, timedelta
    hkt = timezone(timedelta(hours=8))
    now = datetime.now(hkt)
    today = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p HKT")

    llm = GeminiLiveLLMService(
        api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
        settings=GeminiLiveLLMService.Settings(
            voice="Aoede",
        ),
    )

    # --- Context with initial greeting trigger ---
    context = LLMContext([
        {
            "role": "developer",
            "content": f"""You are Sarah, an AI assistant with eyes and ears. You can SEE through the user's camera and HEAR them speak simultaneously.
Today is {today}, current time is {current_time}.

When you first connect, greet the user warmly and tell them you can see through their camera.

VISION CAPABILITIES:
- Describe what the camera shows in real-time
- Read text, menus, signs, labels in any language and translate
- Identify objects, places, food, plants, products
- For skin concerns: analyze and give professional skincare advice
- For travel: identify landmarks, read maps, translate signs

RULES:
- Keep spoken responses to 1-3 sentences. Be concise.
- Be specific and helpful when describing what you see
- Use natural speech, not robotic descriptions
- Sound warm and friendly
- No markdown, lists, or asterisks — this is spoken conversation"""
        },
    ])

    # Server-side VAD is enabled by default; no local VAD needed
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)

    # --- Pipeline (matching official example structure) ---
    pipeline = Pipeline([
        transport.input(),
        user_aggregator,
        llm,
        transport.output(),
        assistant_aggregator,
    ])

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"Participant joined: {participant['id']}")

        # Capture camera video at 1 fps
        await transport.capture_participant_video(
            participant["id"],
            framerate=1,
            video_source="camera",
            color_format="RGB",
        )

        # Trigger initial greeting
        await task.queue_frames([LLMRunFrame()])

        # Wait then unpause audio/video input
        await asyncio.sleep(3)
        logger.debug("Unpausing audio and video input")
        llm.set_audio_input_paused(False)
        llm.set_video_input_paused(False)
        logger.info("Vision mode fully active — camera + voice + AI")

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant left: {reason}")
        await task.cancel()

    runner = PipelineRunner()
    await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
