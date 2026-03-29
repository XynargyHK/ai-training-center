"""
Pipecat Voice AI Agent — Full-duplex conversation
Uses: Deepgram STT + Cerebras LLM + Cartesia TTS + Daily WebRTC
"""
import asyncio
import os
import sys

from pipecat.frames.frames import LLMMessagesFrame, EndFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.services.daily import DailyParams, DailyTransport
from pipecat.vad.silero import SileroVADAnalyzer

from loguru import logger

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")


async def main():
    # Daily room URL passed from the API endpoint
    room_url = os.getenv("DAILY_ROOM_URL")
    daily_api_key = os.getenv("DAILY_API_KEY")

    if not room_url:
        logger.error("DAILY_ROOM_URL not set")
        return

    # --- Transport: Daily WebRTC ---
    transport = DailyTransport(
        room_url,
        None,  # token (None = guest)
        "AI Assistant",
        DailyParams(
            api_key=daily_api_key,
            audio_out_enabled=True,
            audio_out_sample_rate=24000,
            audio_in_enabled=True,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        ),
    )

    # --- STT: Deepgram ---
    stt = DeepgramSTTService(
        api_key=os.getenv("DEEPGRAM_API_KEY"),
        language="en",
    )

    # --- LLM: Cerebras (OpenAI-compatible) ---
    llm = OpenAILLMService(
        api_key=os.getenv("CEREBRAS_API_KEY"),
        base_url="https://api.cerebras.ai/v1",
        model="llama3.1-8b",
    )

    # --- TTS: Cartesia Sonic ---
    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id=os.getenv("CARTESIA_VOICE_ID", "a0e99841-438c-4a64-b679-ae501e7d6091"),  # Barbershop Man default
        model_id="sonic",
        sample_rate=24000,
    )

    # --- System prompt ---
    messages = [
        {
            "role": "system",
            "content": """You are a voice AI assistant. You speak like a real person in a phone call — not a chatbot.

Rules:
- Keep replies to 1-2 sentences max. Be concise.
- Use natural fillers occasionally: "hmm", "well", "you know", "let me think..."
- Use contractions: "I'm", "don't", "can't", "it's"
- React naturally: laugh ("haha"), express surprise ("oh wow"), show empathy ("ah I see")
- No markdown, no lists, no asterisks. This is spoken language.
- Sound warm and friendly, like talking to a colleague.""",
        },
    ]

    # --- Pipeline: STT → LLM → TTS ---
    pipeline = Pipeline(
        [
            transport.input(),   # audio from user (WebRTC)
            stt,                 # speech-to-text
            llm,                 # language model
            tts,                 # text-to-speech
            transport.output(),  # audio back to user (WebRTC)
        ]
    )

    task = PipelineTask(
        pipeline,
        PipelineParams(
            allow_interruptions=True,       # full-duplex: user can interrupt AI
            enable_metrics=True,
        ),
    )

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"Participant joined: {participant['id']}")
        # Send initial greeting
        await task.queue_frames(
            [LLMMessagesFrame(messages + [{"role": "user", "content": "Say a brief greeting to start the conversation."}])]
        )

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant left: {participant['id']}")
        await task.queue_frame(EndFrame())

    runner = PipelineRunner()
    await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
