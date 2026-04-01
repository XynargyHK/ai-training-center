"""
Pipecat Voice + Vision AI Agent
Uses: Gemini 2.5 Flash Native Audio (multimodal live) — audio + video in one service
No separate STT/TTS needed — Gemini handles everything natively.
"""
import asyncio
import os
import sys

from pipecat.frames.frames import TextFrame, TranscriptionFrame
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.transports.daily.transport import DailyOutputTransportMessageFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask

try:
    from pipecat.transports.daily.transport import DailyParams, DailyTransport
except ImportError:
    from pipecat.transports.services.daily import DailyParams, DailyTransport

try:
    from pipecat.audio.vad.silero import SileroVADAnalyzer
except ImportError:
    try:
        from pipecat.vad.silero import SileroVADAnalyzer
    except ImportError:
        SileroVADAnalyzer = None

from loguru import logger

try:
    logger.remove(0)
except ValueError:
    pass
logger.add(sys.stderr, level="DEBUG")


class LLMTextForwarder(FrameProcessor):
    """Sends AI response text to browser as subtitles."""
    def __init__(self, name="LLMTextForwarder"):
        super().__init__(name=name)
        self._text = ""

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        fn = type(frame).__name__
        if "LLMFullResponseStart" in fn or "LLMResponseStart" in fn:
            self._text = ""
        if isinstance(frame, TextFrame):
            self._text += frame.text
            msg = DailyOutputTransportMessageFrame(
                message={"type": "llm", "text": self._text}
            )
            await self.push_frame(msg, FrameDirection.DOWNSTREAM)
        await self.push_frame(frame, direction)


async def main():
    room_url = os.getenv("DAILY_ROOM_URL")
    daily_api_key = os.getenv("DAILY_API_KEY")

    if not room_url:
        logger.error("DAILY_ROOM_URL not set")
        return

    # --- Transport: Daily WebRTC with VIDEO INPUT enabled ---
    transport = DailyTransport(
        room_url,
        None,
        "AI Vision Assistant",
        DailyParams(
            api_key=daily_api_key,
            audio_out_enabled=True,
            audio_out_sample_rate=24000,
            audio_in_enabled=True,
            video_in_enabled=True,  # Enable camera input from browser
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer() if SileroVADAnalyzer else None,
            vad_audio_passthrough=True,
        ),
    )

    # --- LLM: Gemini Multimodal Live (audio + vision in one) ---
    from pipecat.services.google.gemini_live import GeminiLiveLLMService
    try:
        from pipecat.services.google.gemini_live.llm import GeminiMediaResolution
        media_res = GeminiMediaResolution.HIGH
    except ImportError:
        media_res = None
        logger.warning("GeminiMediaResolution not available — using default resolution")

    from datetime import datetime, timezone, timedelta
    hkt = timezone(timedelta(hours=8))
    now = datetime.now(hkt)
    today = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p HKT")

    system_instruction = f"""You are Sarah, an AI assistant with eyes and ears. You can SEE through the user's camera and HEAR them speak simultaneously.

Today is {today}, current time is {current_time}.

VISION CAPABILITIES:
- You can see what the camera shows in real-time
- When the user points the camera at something, describe what you see
- Read text, menus, signs, labels in any language and translate if asked
- Identify objects, places, food, plants, products
- For skin concerns: analyze what you see and give professional skincare advice
- For travel: identify landmarks, read maps, translate signs

RULES:
- Keep spoken responses to 1-3 sentences. Be concise.
- When describing what you see, be specific and helpful
- If you can't see clearly, say so naturally: "Could you hold the camera a bit steadier?"
- Use natural speech patterns, not robotic descriptions
- Sound warm and friendly
- No markdown, lists, or asterisks — this is spoken conversation
- If the user asks "what do you see?" — describe the camera view in detail
- Proactively mention interesting things you notice in the camera feed"""

    settings_kwargs = {
        "model": "models/gemini-2.5-flash-native-audio-preview-12-2025",
        "system_instruction": system_instruction,
        "voice": "Aoede",
        "language": "en-US",
    }
    if media_res is not None:
        settings_kwargs["media_resolution"] = media_res

    llm = GeminiLiveLLMService(
        api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
        settings=GeminiLiveLLMService.Settings(**settings_kwargs),
    )

    # --- Text forwarder for subtitles ---
    text_fwd = LLMTextForwarder()

    # --- Pipeline ---
    pipeline = Pipeline([
        transport.input(),
        llm,              # Gemini handles STT + Vision + LLM + TTS all in one
        text_fwd,
        transport.output(),
    ])

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
        ),
    )

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"Participant joined: {participant['id']}")
        # Capture video from the participant's camera
        await transport.capture_participant_video(
            participant["id"],
            framerate=1,  # 1 frame per second (Gemini Live throttles to 1fps anyway)
            video_source="camera",
            color_format="RGB",
        )
        logger.info("Camera capture started — vision mode active")

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant left: {reason}")
        await task.queue_frame(asyncio.ensure_future(task.cancel()))

    runner = PipelineRunner()
    await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
