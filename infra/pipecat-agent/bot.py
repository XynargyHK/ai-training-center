"""
Pipecat Voice AI Agent — Full-duplex conversation
Supports both browser and phone calls through the same pipeline.
All tools are modular (tools/*.py). bot.py is just pipeline wiring.
"""
import asyncio
import os
import sys

from pipecat.frames.frames import EndFrame, TextFrame, TranscriptionFrame
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.transports.daily.transport import DailyOutputTransportMessageFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.services.deepgram.stt import DeepgramSTTService
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


class STTForwarder(FrameProcessor):
    """Sends user speech transcripts to browser."""
    def __init__(self, name="STTForwarder"):
        super().__init__(name=name)

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        if isinstance(frame, TranscriptionFrame):
            msg = DailyOutputTransportMessageFrame(message={"type": "stt", "text": frame.text})
            await self.push_frame(msg, FrameDirection.DOWNSTREAM)
        await self.push_frame(frame, direction)


class CJKSpaceFixer(FrameProcessor):
    """Removes extra spaces between CJK characters in TextFrames."""
    def __init__(self, name="CJKSpaceFixer"):
        super().__init__(name=name)

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        if isinstance(frame, TextFrame):
            import re
            fixed = re.sub(r'(?<=[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef])\s+(?=[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef])', '', frame.text)
            if fixed != frame.text:
                frame = TextFrame(text=fixed)
        await self.push_frame(frame, direction)


class LLMForwarder(FrameProcessor):
    """Sends AI response text to browser."""
    def __init__(self, name="LLMForwarder"):
        super().__init__(name=name)
        self._text = ""

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        fn = type(frame).__name__
        if "LLMFullResponseStart" in fn or "LLMResponseStart" in fn:
            self._text = ""
        if isinstance(frame, TextFrame):
            self._text += frame.text
            msg = DailyOutputTransportMessageFrame(message={"type": "llm", "text": self._text})
            await self.push_frame(msg, FrameDirection.DOWNSTREAM)
        await self.push_frame(frame, direction)


async def run_pipeline(
    room_url,
    token=None,
    lang="en",
    mode="browser",
    dialout_settings=None,
    vision_enabled=False,
    greeting=None,
):
    """Run the voice AI pipeline.

    Args:
        room_url: Daily room URL
        token: Daily meeting token (owner token needed for dialout)
        lang: language code (en, yue, zh, etc.)
        mode: "browser" or "phone"
        dialout_settings: dict with {"sipUri": "...", "displayName": "..."} or None
        vision_enabled: whether to capture video (browser only)
        greeting: optional greeting text to speak first (for phone calls)
    """
    daily_api_key = os.getenv("DAILY_API_KEY")

    if not room_url:
        logger.error("room_url is required")
        return

    # Phone mode never uses vision
    if mode == "phone":
        vision_enabled = False

    participant_id_ref = [None]

    # --- Transport: Daily WebRTC ---
    transport = DailyTransport(
        room_url,
        token,
        "AI Assistant",
        DailyParams(
            api_key=daily_api_key,
            audio_out_enabled=True,
            audio_out_sample_rate=24000,
            audio_in_enabled=True,
            video_in_enabled=vision_enabled,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        ),
    )

    # --- STT ---
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
            language="multi",
        )

    # --- LLM: Gemini Flash ---
    from pipecat.services.google.llm import GoogleLLMService
    llm = GoogleLLMService(
        api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
        model="gemini-2.0-flash",
    )

    # --- TTS ---
    tts_provider = os.getenv("TTS_PROVIDER", "azure")
    tts_voice = os.getenv("TTS_VOICE", "")

    if lang == "yue":
        from pipecat.services.azure.tts import AzureTTSService
        tts = AzureTTSService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            voice="zh-HK-WanLungNeural",
            sample_rate=24000,
        )
    elif tts_provider == "elevenlabs":
        from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
        tts = ElevenLabsTTSService(
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            sample_rate=24000,
            settings=ElevenLabsTTSService.Settings(
                voice=tts_voice or "EXAVITQu4vr4xnSDxMaL",
                model="eleven_turbo_v2_5",
            ),
        )
    elif tts_provider == "cartesia":
        tts = CartesiaTTSService(
            api_key=os.getenv("CARTESIA_API_KEY"),
            voice_id=tts_voice or "a0e99841-438c-4a64-b679-ae501e7d6091",
            model_id="sonic",
            sample_rate=24000,
        )
    elif tts_provider == "openai":
        from pipecat.services.openai.tts import OpenAITTSService
        tts = OpenAITTSService(
            api_key=os.getenv("OPENAI_API_KEY"),
            voice=tts_voice or "nova",
            model="tts-1",
            sample_rate=24000,
        )
    elif tts_provider == "gemini":
        from pipecat.services.google.tts import GeminiTTSService
        tts = GeminiTTSService(
            api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
            sample_rate=24000,
            settings=GeminiTTSService.Settings(
                voice=tts_voice or "Aoede",
                model="gemini-2.5-flash-tts",
            ),
        )
    else:
        from pipecat.services.azure.tts import AzureTTSService
        tts = AzureTTSService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            voice=tts_voice or "en-US-JennyMultilingualNeural",
            sample_rate=24000,
        )
    logger.info(f"TTS: {tts_provider} / {tts_voice}")

    # --- System prompt ---
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
        system_content = f"""You are a multilingual voice AI assistant. You speak like a real person in a phone call — not a chatbot.
Today's date is {today}. The current time is {current_time}.

You can understand and respond in multiple languages. The user may speak English, Mandarin, Cantonese, Japanese, Korean, French, Spanish, German, or any other language. Detect what language they speak and respond in the same language by default.

You have these tools:
1. search_web(query) — search the internet for current info like prices, news, weather.
2. open_url(url) — open a website on the user's screen.
3. send_whatsapp(phone, message) — send a real WhatsApp message.
4. make_call(phone) — dial a phone number.
5. send_email(to, subject, body) — open email compose.
6. switch_language(language) — switch your speaking language when the user asks. This also changes your voice.
7. translate(target_language) — become a real-time translator. Translate everything the user says into the target language.

Rules:
- Keep replies to 1-2 sentences max. Be concise.
- Use natural fillers occasionally.
- No markdown, no lists, no asterisks. This is spoken language.
- Sound warm and friendly, like talking to a colleague.
- If the user speaks a different language, respond in that language automatically.
- After searching, summarize the key finding naturally. Don't read out URLs."""

    messages = [{"role": "system", "content": system_content}]

    # --- ALL tools are now modular (tools/*.py) ---
    from tools import get_schemas, register_all
    register_all(llm, tts, transport=transport, participant_id_ref=participant_id_ref if vision_enabled else None)

    all_schemas = get_schemas(include_vision=vision_enabled)
    tools = ToolsSchema(standard_tools=all_schemas)
    logger.info(f"Tools: {len(all_schemas)} functions enabled (vision={vision_enabled})")

    # --- Context (universal, not deprecated OpenAILLMContext) ---
    context = LLMContext(messages=messages, tools=tools)
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)

    # --- Reasoning Logger (Level 2 observability) ---
    from parts.reasoning_logger import ReasoningLogger
    reasoning_logger = ReasoningLogger()

    # --- Pipeline ---
    # In phone mode, skip STTForwarder and LLMForwarder (no browser to send messages to)
    if mode == "phone":
        pipeline_stages = [
            transport.input(),
            stt,
            user_aggregator,
            llm,
            reasoning_logger,
            CJKSpaceFixer(),
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    else:
        pipeline_stages = [
            transport.input(),
            stt,
            STTForwarder(),
            user_aggregator,
            llm,
            reasoning_logger,
            CJKSpaceFixer(),
            LLMForwarder(),
            tts,
            transport.output(),
            assistant_aggregator,
        ]

    pipeline = Pipeline(pipeline_stages)

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
        ),
    )

    if mode == "phone":
        # --- Phone mode event handlers ---
        @transport.event_handler("on_joined")
        async def on_joined(transport_obj, data):
            logger.info(f"Phone mode: bot joined room, initiating dialout")
            if dialout_settings:
                try:
                    await transport_obj.start_dialout(dialout_settings)
                    logger.info(f"Dialout started: {dialout_settings}")
                except Exception as e:
                    logger.error(f"Dialout failed: {e}")

        @transport.event_handler("on_dialout_answered")
        async def on_dialout_answered(transport_obj, data):
            logger.info(f"Dialout answered: {data}")
            if greeting:
                # Speak the greeting text directly via TTS
                await task.queue_frames([TextFrame(text=greeting)])
            else:
                # Run LLM for a natural greeting
                from pipecat.frames.frames import LLMRunFrame
                await task.queue_frames([LLMRunFrame()])

        @transport.event_handler("on_dialout_error")
        async def on_dialout_error(transport_obj, data):
            logger.error(f"Dialout error: {data}")
            await task.queue_frame(EndFrame())

        @transport.event_handler("on_participant_left")
        async def on_participant_left(transport_obj, participant, reason):
            logger.info(f"Phone participant left: {participant['id']}, reason: {reason}")
            import asyncio as _asyncio
            from parts.session_logger import log_session
            try:
                msgs = [{"role": m.get("role", ""), "content": m.get("content", "")} for m in context.messages] if hasattr(context, 'messages') else []
                _asyncio.create_task(log_session(msgs, lang=lang))
            except Exception as e:
                logger.warning(f"Session log failed (non-fatal): {e}")
            await task.queue_frame(EndFrame())

    else:
        # --- Browser mode event handlers ---
        @transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport_obj, participant):
            logger.info(f"Participant joined: {participant['id']}")
            participant_id_ref[0] = participant["id"]
            if vision_enabled:
                await transport_obj.capture_participant_video(
                    participant["id"],
                    framerate=0,
                    video_source="camera",
                    color_format="RGB",
                )
                logger.info(f"Vision: capturing video from {participant['id']} (on-demand)")
            from pipecat.frames.frames import LLMRunFrame
            await task.queue_frames([LLMRunFrame()])

        @transport.event_handler("on_participant_left")
        async def on_participant_left(transport_obj, participant, reason):
            logger.info(f"Participant left: {participant['id']}")
            import asyncio as _asyncio
            from parts.session_logger import log_session
            try:
                msgs = [{"role": m.get("role", ""), "content": m.get("content", "")} for m in context.messages] if hasattr(context, 'messages') else []
                _asyncio.create_task(log_session(msgs, lang=lang))
            except Exception as e:
                logger.warning(f"Session log failed (non-fatal): {e}")
            await task.queue_frame(EndFrame())

    logger.info(f"Pipeline ready: mode={mode}, lang={lang}, vision={vision_enabled}")
    runner = PipelineRunner()
    await runner.run(task)


async def main():
    """Thin wrapper for standalone/browser mode (backward compatible)."""
    room_url = os.getenv("DAILY_ROOM_URL")
    lang = os.getenv("VOICE_LANG", "en")
    vision = os.getenv("VISION_ENABLED", "false").lower() == "true"
    await run_pipeline(room_url=room_url, lang=lang, mode="browser", vision_enabled=vision)


if __name__ == "__main__":
    asyncio.run(main())
