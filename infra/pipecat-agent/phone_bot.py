"""
Pipecat Phone Bot — AI phone calls via Twilio WebSocket
Uses: Deepgram STT + Gemini Flash LLM + Azure TTS + Twilio Media Streams
Audio: 8kHz mulaw (phone standard) via TwilioFrameSerializer
"""
import asyncio
import os
import sys
import time

from pipecat.frames.frames import LLMMessagesFrame, EndFrame, TextFrame, TranscriptionFrame, UserStartedSpeakingFrame
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.services.llm_service import FunctionCallParams
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.transports.websocket.server import WebsocketServerTransport, WebsocketServerParams
from pipecat.serializers.twilio import TwilioFrameSerializer
import json


class AutoStreamSidTwilioSerializer(TwilioFrameSerializer):
    """TwilioFrameSerializer that auto-captures stream_sid from the 'start' event.
    Pipecat's default serializer doesn't update stream_sid from incoming messages."""
    def deserialize(self, data):
        if isinstance(data, str):
            try:
                msg = json.loads(data)
                if msg.get("event") == "start":
                    sid = msg.get("start", {}).get("streamSid", "") or msg.get("streamSid", "")
                    if sid:
                        self._stream_sid = sid
                        logger.info(f"Captured Twilio streamSid: {sid}")
            except (json.JSONDecodeError, KeyError):
                pass
        return super().deserialize(data)

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


class STTLatencyMonitor(FrameProcessor):
    """Monitors STT TTFB and forces reconnection when latency exceeds threshold."""
    def __init__(self, stt_service, threshold=3.0, name="STTLatencyMonitor"):
        super().__init__(name=name)
        self._stt = stt_service
        self._threshold = threshold
        self._speech_start = None
        self._recycling = False

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        if isinstance(frame, UserStartedSpeakingFrame):
            self._speech_start = time.time()
        elif isinstance(frame, TranscriptionFrame) and self._speech_start:
            ttfb = time.time() - self._speech_start
            self._speech_start = None
            if ttfb > self._threshold and not self._recycling:
                logger.warning(f"STT TTFB {ttfb:.1f}s exceeds {self._threshold}s — recycling connection")
                self._recycling = True
                asyncio.create_task(self._recycle())
        await self.push_frame(frame, direction)

    async def _recycle(self):
        try:
            await self._stt._update_settings(self._stt._settings)
            logger.info("STT connection recycled successfully")
        except Exception as e:
            logger.error(f"STT recycle failed: {e}")
        finally:
            self._recycling = False


async def run_phone_bot(websocket_server_host, websocket_server_port, stream_sid, call_sid, from_number, to_number):
    """Run the phone bot pipeline for a Twilio call."""

    # --- TTS: Azure multilingual (works great for phone) ---
    from pipecat.services.azure.tts import AzureTTSService
    tts = AzureTTSService(
        api_key=os.getenv("AZURE_SPEECH_KEY"),
        region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
        voice="en-US-JennyMultilingualNeural",
        sample_rate=8000,  # Phone audio = 8kHz
    )

    # --- STT: Azure Auto-Detect (same as browser auto-detect mode) ---
    # Import the AutoDetectAzureSTTService from bot.py
    import importlib.util, sys
    bot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bot.py")
    spec = importlib.util.spec_from_file_location("bot_module", bot_path)
    bot_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bot_module)
    stt = bot_module.AutoDetectAzureSTTService.create(
        api_key=os.getenv("AZURE_SPEECH_KEY"),
        region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
        candidate_languages=["en-US", "zh-HK", "zh-CN", "vi-VN", "ja-JP", "ko-KR", "fr-FR", "es-ES", "de-DE"],
        sample_rate=8000,
    )
    logger.info("Phone STT: Azure Auto-Detect (en/yue/zh/vi/ja/ko/fr/es/de)")

    # --- LLM: Gemini Flash ---
    from pipecat.services.google.llm import GoogleLLMService
    llm = GoogleLLMService(
        api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
        model="gemini-2.0-flash",
    )

    # --- System prompt ---
    from datetime import datetime, timezone, timedelta
    hkt = timezone(timedelta(hours=8))
    now = datetime.now(hkt)
    today = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p HKT")

    system_content = f"""You are a multilingual voice AI assistant making a phone call. You speak like a real person — warm, professional, concise.
Today's date is {today}. The current time is {current_time}.
You are calling {to_number} from {from_number}.

Auto-detect the language the person speaks and ALWAYS respond in that SAME language. If they speak Cantonese, respond in colloquial Cantonese (用「係」唔好用「是」). If they speak English, respond in English. If they speak Mandarin, respond in Mandarin. Match their language exactly.

You have these tools:
1. search_web(query) — search the internet for current info.
2. send_whatsapp(phone, message) — send a WhatsApp message after the call.
3. send_email(to, subject, body) — send a follow-up email.

Rules:
- Keep replies to 1-2 sentences max. Phone conversations should be concise.
- Use natural fillers occasionally.
- No markdown, no lists. This is a phone call.
- Sound warm and professional, like a real business call.
- If asked to schedule/book something, confirm the details clearly.
- Say goodbye naturally when the conversation ends."""

    messages = [{"role": "system", "content": system_content}]

    # --- Function calling: search_web ---
    search_web_func = FunctionSchema(
        name="search_web",
        description="Search the web for current information.",
        properties={
            "query": {"type": "string", "description": "The search query"}
        },
        required=["query"],
    )

    async def handle_search_web(params: FunctionCallParams):
        import aiohttp
        query = params.arguments.get("query", "")
        logger.info(f"Phone bot searching: {query}")
        try:
            url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
            headers = {"User-Agent": "Mozilla/5.0"}
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    html = await resp.text()
            import re
            text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            await params.result_callback({"results": text[:3000], "query": query})
        except Exception as e:
            await params.result_callback({"error": str(e)})

    llm.register_function("search_web", handle_search_web)

    # --- Function calling: send_whatsapp ---
    send_whatsapp_func = FunctionSchema(
        name="send_whatsapp",
        description="Send a WhatsApp message to a phone number.",
        properties={
            "phone": {"type": "string", "description": "Phone number with country code"},
            "message": {"type": "string", "description": "Message text"}
        },
        required=["phone", "message"],
    )

    async def handle_send_whatsapp(params: FunctionCallParams):
        import aiohttp
        phone = params.arguments.get("phone", "").replace("+", "").replace(" ", "")
        message = params.arguments.get("message", "")
        whapi_token = os.getenv("WHAPI_TOKEN", "")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://gate.whapi.cloud/messages/text",
                    headers={"Authorization": f"Bearer {whapi_token}", "Content-Type": "application/json"},
                    json={"to": phone, "body": message},
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status in (200, 201):
                        await params.result_callback({"status": "sent"})
                    else:
                        await params.result_callback({"status": "failed"})
        except Exception as e:
            await params.result_callback({"status": "failed", "error": str(e)})

    llm.register_function("send_whatsapp", handle_send_whatsapp)

    # --- Function calling: send_email ---
    send_email_func = FunctionSchema(
        name="send_email",
        description="Send a follow-up email.",
        properties={
            "to": {"type": "string", "description": "Email address"},
            "subject": {"type": "string", "description": "Subject line"},
            "body": {"type": "string", "description": "Email body"}
        },
        required=["to"],
    )

    async def handle_send_email(params: FunctionCallParams):
        to = params.arguments.get("to", "")
        logger.info(f"Phone bot: email to {to}")
        await params.result_callback({"status": "queued", "to": to})

    llm.register_function("send_email", handle_send_email)

    # --- Tools ---
    tools = ToolsSchema(standard_tools=[search_web_func, send_whatsapp_func, send_email_func])

    # --- Context ---
    context = LLMContext(messages=messages, tools=tools)
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)

    # --- Transport: Twilio WebSocket ---
    serializer = AutoStreamSidTwilioSerializer(
        stream_sid=stream_sid or "pending",
        call_sid=call_sid,
        account_sid=os.getenv("TWILIO_ACCOUNT_SID"),
        auth_token=os.getenv("TWILIO_AUTH_TOKEN"),
    )

    transport = WebsocketServerTransport(
        params=WebsocketServerParams(
            serializer=serializer,
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        ),
        host=websocket_server_host,
        port=websocket_server_port,
    )

    # --- STT Monitor ---
    stt_monitor = STTLatencyMonitor(stt_service=stt, threshold=3.0)

    # --- Pipeline ---
    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            stt_monitor,
            user_aggregator,
            llm,
            CJKSpaceFixer(),
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
            audio_in_sample_rate=8000,
            audio_out_sample_rate=8000,
        ),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Phone call connected: {to_number}")
        from pipecat.frames.frames import LLMRunFrame
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Phone call disconnected: {to_number}")
        await task.queue_frame(EndFrame())

    runner = PipelineRunner()
    await runner.run(task)
