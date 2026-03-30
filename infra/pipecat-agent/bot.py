"""
Pipecat Voice AI Agent — Full-duplex conversation
Uses: Deepgram STT + Cerebras/Gemini LLM + Cartesia/Azure TTS + Daily WebRTC
Supports web search via DuckDuckGo (English mode)
"""
import asyncio
import os
import sys

import json
from pipecat.frames.frames import LLMMessagesFrame, EndFrame, TextFrame, TranscriptionFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
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


class SubtitleProcessor(FrameProcessor):
    """Intercepts text frames and sends them to the browser via Daily app messages."""

    def __init__(self, transport):
        super().__init__()
        self._transport = transport
        self._ai_text = ""

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            # User speech transcript
            try:
                await self._transport.send_app_message({
                    "type": "transcript",
                    "role": "user",
                    "text": frame.text
                })
            except Exception as e:
                logger.debug(f"Could not send transcript: {e}")

        elif isinstance(frame, TextFrame):
            # AI response text (streaming chunks)
            self._ai_text += frame.text
            try:
                await self._transport.send_app_message({
                    "type": "subtitle",
                    "role": "assistant",
                    "text": self._ai_text,
                    "delta": frame.text
                })
            except Exception as e:
                logger.debug(f"Could not send subtitle: {e}")

        # Always pass frame through
        await self.push_frame(frame, direction)


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
    lang = os.getenv("VOICE_LANG", "en")
    if lang == "yue":
        from pipecat.services.azure.stt import AzureSTTService
        stt = AzureSTTService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastasia"),
            language="zh-HK",
            sample_rate=24000,
        )
    else:
        stt = DeepgramSTTService(
            api_key=os.getenv("DEEPGRAM_API_KEY"),
            language="en",
        )

    # --- LLM: Gemini Flash for both (supports function calling for web search) ---
    from pipecat.services.google.llm import GoogleLLMService
    llm = GoogleLLMService(
        api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
        model="gemini-2.0-flash",
    )

    # --- TTS: Azure for Cantonese, Cartesia for English ---
    if lang == "yue":
        from pipecat.services.azure.tts import AzureTTSService
        tts = AzureTTSService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastasia"),
            voice=os.getenv("VOICE_NAME", "zh-HK-WanLungNeural"),
            sample_rate=24000,
        )
    else:
        tts = CartesiaTTSService(
            api_key=os.getenv("CARTESIA_API_KEY"),
            voice_id=os.getenv("CARTESIA_VOICE_ID", "a0e99841-438c-4a64-b679-ae501e7d6091"),
            model_id="sonic",
            sample_rate=24000,
        )

    # --- Context with system prompt ---
    from datetime import datetime, timezone, timedelta
    hkt = timezone(timedelta(hours=8))
    now = datetime.now(hkt)
    today = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p HKT")

    if lang == "yue":
        system_content = f"""你係一個語音AI助手。你講嘢要好似真人打電話咁，唔好似機械人。
今日係{today}，而家時間係{current_time}。

規則：
- 每次回覆最多1-2句，要簡潔
- 一定要用廣東話口語：用「係」唔好用「是」，用「嘅」唔好用「的」，用「咁」唔好用「這樣」
- 自然啲回應：「嗯...」「哦！」「明白」「係喎」
- 唔好用markdown、列表、星號。呢個係講嘢，唔係打字
- 語氣要親切友善，好似同朋友傾計咁"""
    else:
        system_content = f"""You are a voice AI assistant. You speak like a real person in a phone call — not a chatbot.
Today's date is {today}. The current time is {current_time}.

You have Google Search available. Use it freely when the user asks about current events, news, prices, weather, sports scores, or anything that needs real-time information.

Rules:
- Keep replies to 1-2 sentences max. Be concise.
- Use natural fillers occasionally: "hmm", "well", "you know", "let me think..."
- Use contractions: "I'm", "don't", "can't", "it's"
- React naturally: laugh ("haha"), express surprise ("oh wow"), show empathy ("ah I see")
- No markdown, no lists, no asterisks. This is spoken language.
- Sound warm and friendly, like talking to a colleague.
- After searching, summarize the key finding naturally. Don't read out URLs."""

    messages = [{"role": "system", "content": system_content}]

    # --- Google Search grounding (built-in, no custom tool needed) ---
    tools = None
    try:
        from google.genai import types as gtypes
        tools = [gtypes.Tool(google_search=gtypes.GoogleSearch())]
        logger.info("Google Search grounding enabled")
    except Exception as e:
        logger.warning(f"Google Search grounding failed: {e}, trying fallback")
        try:
            from google.genai.types import Tool, GoogleSearch
            tools = [Tool(google_search=GoogleSearch())]
            logger.info("Google Search grounding enabled (fallback import)")
        except Exception as e2:
            logger.error(f"Could not enable Google Search: {e2}")
            tools = None

    # Create LLM context and aggregator pair for conversation management
    context = OpenAILLMContext(messages, tools=tools)
    context_aggregator = llm.create_context_aggregator(context)

    # --- Subtitle processor: intercepts text and sends to browser ---
    subtitle_proc = SubtitleProcessor(transport)

    # --- Pipeline: STT → Subtitle → UserAggregator → LLM → Subtitle → TTS → Output ---
    pipeline = Pipeline(
        [
            transport.input(),                    # audio from user (WebRTC)
            stt,                                  # speech-to-text
            subtitle_proc,                        # captures user transcript + AI text
            context_aggregator.user(),            # collects user speech, sends to LLM
            llm,                                  # language model
            SubtitleProcessor(transport),          # captures AI response text
            tts,                                  # text-to-speech
            transport.output(),                   # audio back to user (WebRTC)
            context_aggregator.assistant(),        # tracks AI responses for context
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,       # full-duplex: user can interrupt AI
            enable_metrics=True,
        ),
    )

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"Participant joined: {participant['id']}")
        # Trigger initial greeting via context
        await task.queue_frames([context_aggregator.user().get_context_frame()])

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant left: {participant['id']}")
        await task.queue_frame(EndFrame())

    runner = PipelineRunner()
    await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
