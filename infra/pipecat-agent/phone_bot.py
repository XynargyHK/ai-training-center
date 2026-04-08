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
from pipecat.transports.websocket.fastapi import FastAPIWebsocketTransport, FastAPIWebsocketParams
from pipecat.serializers.twilio import TwilioFrameSerializer
import json


class AutoStreamSidTwilioSerializer(TwilioFrameSerializer):
    """TwilioFrameSerializer that auto-captures stream_sid AND call_sid from the 'start' event."""
    def deserialize(self, data):
        if isinstance(data, str):
            try:
                msg = json.loads(data)
                if msg.get("event") == "start":
                    start = msg.get("start", {})
                    sid = start.get("streamSid", "") or msg.get("streamSid", "")
                    if sid:
                        self._stream_sid = sid
                        logger.info(f"Captured Twilio streamSid: {sid}")
                    csid = start.get("callSid", "") or msg.get("callSid", "")
                    if csid:
                        self._call_sid = csid
                        logger.info(f"Captured Twilio callSid: {csid}")
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

    # --- TTS: Pick voice based on language ---
    from pipecat.services.azure.tts import AzureTTSService
    from config.voices import LANGUAGE_VOICES, MULTILINGUAL_VOICE

    call_lang = os.getenv("VOICE_LANG", "en")
    lang_map = {"en": "english", "yue": "cantonese", "zh": "mandarin", "ja": "japanese",
                "ko": "korean", "fr": "french", "es": "spanish", "de": "german", "vi": "vietnamese"}
    lang_key = lang_map.get(call_lang, "english")
    tts_voice = LANGUAGE_VOICES.get(lang_key, MULTILINGUAL_VOICE)
    logger.info(f"Phone TTS: {tts_voice} (lang={call_lang})")

    tts = AzureTTSService(
        api_key=os.getenv("AZURE_SPEECH_KEY"),
        region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
        voice=tts_voice,
        sample_rate=8000,  # Phone audio = 8kHz
    )

    # --- STT: Use fixed language when known, auto-detect when not ---
    stt_lang_map = {"en": "en-US", "yue": "zh-HK", "zh": "zh-CN", "ja": "ja-JP",
                    "ko": "ko-KR", "fr": "fr-FR", "es": "es-ES", "de": "de-DE", "vi": "vi-VN"}

    if call_lang in stt_lang_map:
        # Known language: use fixed STT (faster, more accurate)
        from pipecat.services.azure.stt import AzureSTTService
        stt = AzureSTTService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            language=stt_lang_map[call_lang],
            sample_rate=8000,
        )
        logger.info(f"Phone STT: Azure Fixed ({stt_lang_map[call_lang]})")
    else:
        # Unknown language: use auto-detect
        from stt_utils import AutoDetectAzureSTTService
        stt = AutoDetectAzureSTTService.create(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            candidate_languages=["en-US", "zh-HK", "zh-CN", "vi-VN", "ja-JP", "ko-KR", "fr-FR", "es-ES", "de-DE"],
            sample_rate=8000,
        )
        logger.info("Phone STT: Azure Auto-Detect")

    # --- LLM ---
    llm_provider = os.getenv("LLM_PROVIDER", "gemini")

    if llm_provider == "cerebras":
        from pipecat.services.openai.llm import OpenAILLMService
        llm = OpenAILLMService(
            api_key=os.getenv("CEREBRAS_API_KEY"),
            model=os.getenv("CEREBRAS_MODEL", "qwen-3-235b-a22b-instruct-2507"),
            base_url="https://api.cerebras.ai/v1",
        )
        logger.info(f"Phone LLM: Cerebras ({os.getenv('CEREBRAS_MODEL', 'qwen-3-235b-a22b-instruct-2507')})")
    else:
        from pipecat.services.google.llm import GoogleLLMService
        llm = GoogleLLMService(
            api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
            model="gemini-2.0-flash",
        )
        logger.info("Phone LLM: Gemini 2.0 Flash")

    # --- System prompt ---
    from datetime import datetime, timezone, timedelta
    hkt = timezone(timedelta(hours=8))
    now = datetime.now(hkt)
    today = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p HKT")

    # Language-specific greetings and system prompts
    lang_prompts = {
        "yue": f"""你係一個廣東話語音AI助手，而家打緊電話。你講嘢好似真人一樣——親切、專業、簡潔。
今日係{today}。而家時間係{current_time}。
你而家打緊電話俾{to_number}。

你一定要用廣東話回應。用口語：「係」唔好用「是」，「嘅」唔好用「的」，「咗」唔好用「了」，「唔」唔好用「不」。
盡量唔好用英文字，全部用中文講。例如：appointment=預約，confirm=確認，tomorrow=聽日，booking=訂位，collection=系列。品牌名都盡量用中文讀音。

你有呢啲工具：
1. search_web(query) — 上網搵資料。
2. send_whatsapp(phone, message) — 打完電話之後send WhatsApp訊息。
3. send_email(to, subject, body) — send跟進電郵。

規則：
- 每次回應最多1-2句。電話對話要簡潔。
- 間中用自然嘅語氣詞，例如「嗯」「哦」「好嘅」。
- 唔好用markdown，唔好用列表。呢個係電話對話。
- 要親切專業，好似真人打電話咁。
- 如果要confirm預約，要清楚確認細節。
- 對話完結嘅時候自然咁講bye bye。

重要：你打呢個電話係要確認預約。開場白已經講咗，而家等對方回應。根據佢嘅回應繼續對話。""",

        "en": f"""You are a multilingual voice AI assistant making a phone call. You speak like a real person — warm, professional, concise.
Today's date is {today}. The current time is {current_time}.
You are calling {to_number} from {from_number}.

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
- Say goodbye naturally when the conversation ends.""",
    }

    system_content = lang_prompts.get(call_lang, lang_prompts["en"])

    # Fallback for unlisted languages: use the English prompt with auto-detect
    if call_lang not in lang_prompts:
        system_content += f"\n\nAuto-detect the language the person speaks and ALWAYS respond in that SAME language. If they speak Cantonese, respond in colloquial Cantonese. Match their language exactly."

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

    # --- Additional skills ---
    # --- Tools (depends on LLM provider) ---
    if llm_provider == "cerebras":
        # Cerebras mode: single ask_brain function
        ask_brain_func = FunctionSchema(
            name="ask_brain",
            description="Ask the Brain to do something requiring real data or actions. Use for: search, weather, WhatsApp, maps, directions, currency, notes, reminders, or any request needing real-time data.",
            properties={"message": {"type": "string", "description": "The user's request"}},
            required=["message"],
        )

        async def handle_ask_brain(params: FunctionCallParams):
            import aiohttp
            brain_url = os.getenv("BRAIN_URL", "http://localhost:8000")
            message = params.arguments.get("message", "")
            logger.info(f"Phone: Delegating to Brain: {message[:80]}")
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{brain_url}/think",
                        json={"message": message, "conversation_history": [], "user_context": {"channel": "phone"}},
                        timeout=aiohttp.ClientTimeout(total=30),
                    ) as resp:
                        data = await resp.json()
                        await params.result_callback({"brain_response": data.get("response", "I couldn't process that.")})
            except Exception as e:
                logger.error(f"Phone Brain call failed: {e}")
                await params.result_callback({"brain_response": "Sorry, I had trouble with that."})

        llm.register_function("ask_brain", handle_ask_brain)
        all_tools = [ask_brain_func]
        tools = ToolsSchema(standard_tools=all_tools)
        logger.info("Phone Tools: Cerebras mode — ask_brain → Brain")
    else:
        from skills import get_all_skill_schemas, register_all_skills
        register_all_skills(llm)
        all_tools = [search_web_func, send_whatsapp_func, send_email_func] + get_all_skill_schemas()
        tools = ToolsSchema(standard_tools=all_tools)
        logger.info(f"Phone Tools: Gemini mode — {len(all_tools)} functions")

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
        # Speak greeting directly via TTS (not LLM) so it can't be interrupted
        greetings = {
            "yue": "你好，我係水療中心嘅助手，打嚟確認你嘅預約。請問你聽日方唔方便過嚟呢？",
            "en": "Hi, this is a call from SPA Collection. I'm calling to confirm your appointment. Is tomorrow still good for you?",
        }
        greeting = greetings.get(call_lang, greetings["en"])
        await task.queue_frames([TextFrame(text=greeting)])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Phone call disconnected: {to_number}")
        await task.queue_frame(EndFrame())

    runner = PipelineRunner()
    await runner.run(task)


async def run_phone_bot_fastapi(websocket, stream_sid, call_sid, from_number, to_number, lang="en"):
    """Run the phone bot pipeline using FastAPIWebsocketTransport (no proxy needed).

    Args:
        websocket: FastAPI WebSocket (or ReplayWebSocket wrapper) from the /ws endpoint.
        stream_sid: Twilio stream SID.
        call_sid: Twilio call SID.
        from_number: Caller phone number.
        to_number: Callee phone number.
        lang: Language code (en, yue, zh, ja, etc.).
    """

    # --- TTS: Pick voice based on language ---
    from pipecat.services.azure.tts import AzureTTSService
    from config.voices import LANGUAGE_VOICES, MULTILINGUAL_VOICE

    call_lang = lang
    lang_map = {"en": "english", "yue": "cantonese", "zh": "mandarin", "ja": "japanese",
                "ko": "korean", "fr": "french", "es": "spanish", "de": "german", "vi": "vietnamese"}
    lang_key = lang_map.get(call_lang, "english")
    tts_voice = LANGUAGE_VOICES.get(lang_key, MULTILINGUAL_VOICE)
    logger.info(f"Phone TTS: {tts_voice} (lang={call_lang})")

    tts = AzureTTSService(
        api_key=os.getenv("AZURE_SPEECH_KEY"),
        region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
        voice=tts_voice,
        sample_rate=8000,
    )

    # --- STT: Use fixed language when known, auto-detect when not ---
    stt_lang_map = {"en": "en-US", "yue": "zh-HK", "zh": "zh-CN", "ja": "ja-JP",
                    "ko": "ko-KR", "fr": "fr-FR", "es": "es-ES", "de": "de-DE", "vi": "vi-VN"}

    if call_lang in stt_lang_map:
        from pipecat.services.azure.stt import AzureSTTService
        stt = AzureSTTService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            language=stt_lang_map[call_lang],
            sample_rate=8000,
        )
        logger.info(f"Phone STT: Azure Fixed ({stt_lang_map[call_lang]})")
    else:
        from stt_utils import AutoDetectAzureSTTService
        stt = AutoDetectAzureSTTService.create(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            candidate_languages=["en-US", "zh-HK", "zh-CN", "vi-VN", "ja-JP", "ko-KR", "fr-FR", "es-ES", "de-DE"],
            sample_rate=8000,
        )
        logger.info("Phone STT: Azure Auto-Detect")

    # --- LLM ---
    llm_provider = os.getenv("LLM_PROVIDER", "gemini")

    if llm_provider == "cerebras":
        from pipecat.services.openai.llm import OpenAILLMService
        llm = OpenAILLMService(
            api_key=os.getenv("CEREBRAS_API_KEY"),
            model=os.getenv("CEREBRAS_MODEL", "qwen-3-235b-a22b-instruct-2507"),
            base_url="https://api.cerebras.ai/v1",
        )
        logger.info(f"Phone LLM: Cerebras ({os.getenv('CEREBRAS_MODEL', 'qwen-3-235b-a22b-instruct-2507')})")
    else:
        from pipecat.services.google.llm import GoogleLLMService
        llm = GoogleLLMService(
            api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
            model="gemini-2.0-flash",
        )
        logger.info("Phone LLM: Gemini 2.0 Flash")

    # --- System prompt ---
    from datetime import datetime, timezone, timedelta
    hkt = timezone(timedelta(hours=8))
    now = datetime.now(hkt)
    today = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p HKT")

    lang_prompts = {
        "yue": f"""你係一個廣東話語音AI助手，而家打緊電話。你講嘢好似真人一樣——親切、專業、簡潔。
今日係{today}。而家時間係{current_time}。
你而家打緊電話俾{to_number}。

你一定要用廣東話回應。用口語：「係」唔好用「是」，「嘅」唔好用「的」，「咗」唔好用「了」，「唔」唔好用「不」。
盡量唔好用英文字，全部用中文講。例如：appointment=預約，confirm=確認，tomorrow=聽日，booking=訂位，collection=系列。品牌名都盡量用中文讀音。

你有呢啲工具：
1. search_web(query) — 上網搵資料。
2. send_whatsapp(phone, message) — 打完電話之後send WhatsApp訊息。
3. send_email(to, subject, body) — send跟進電郵。

規則：
- 每次回應最多1-2句。電話對話要簡潔。
- 間中用自然嘅語氣詞，例如「嗯」「哦」「好嘅」。
- 唔好用markdown，唔好用列表。呢個係電話對話。
- 要親切專業，好似真人打電話咁。
- 如果要confirm預約，要清楚確認細節。
- 對話完結嘅時候自然咁講bye bye。

重要：你打呢個電話係要確認預約。開場白已經講咗，而家等對方回應。根據佢嘅回應繼續對話。""",

        "en": f"""You are a multilingual voice AI assistant making a phone call. You speak like a real person — warm, professional, concise.
Today's date is {today}. The current time is {current_time}.
You are calling {to_number} from {from_number}.

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
- Say goodbye naturally when the conversation ends.""",
    }

    system_content = lang_prompts.get(call_lang, lang_prompts["en"])
    if call_lang not in lang_prompts:
        system_content += f"\n\nAuto-detect the language the person speaks and ALWAYS respond in that SAME language. If they speak Cantonese, respond in colloquial Cantonese. Match their language exactly."

    messages = [{"role": "system", "content": system_content}]

    # --- Function calling ---
    search_web_func = FunctionSchema(
        name="search_web",
        description="Search the web for current information.",
        properties={"query": {"type": "string", "description": "The search query"}},
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

    # --- Tools (depends on LLM provider) ---
    if llm_provider == "cerebras":
        ask_brain_func = FunctionSchema(
            name="ask_brain",
            description="Ask the Brain to do something requiring real data or actions. Use for: search, weather, WhatsApp, maps, directions, currency, notes, reminders, or any request needing real-time data.",
            properties={"message": {"type": "string", "description": "The user's request"}},
            required=["message"],
        )

        async def handle_ask_brain(params: FunctionCallParams):
            import aiohttp
            brain_url = os.getenv("BRAIN_URL", "http://localhost:8000")
            message = params.arguments.get("message", "")
            logger.info(f"Phone: Delegating to Brain: {message[:80]}")
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{brain_url}/think",
                        json={"message": message, "conversation_history": [], "user_context": {"channel": "phone"}},
                        timeout=aiohttp.ClientTimeout(total=30),
                    ) as resp:
                        data = await resp.json()
                        await params.result_callback({"brain_response": data.get("response", "I couldn't process that.")})
            except Exception as e:
                logger.error(f"Phone Brain call failed: {e}")
                await params.result_callback({"brain_response": "Sorry, I had trouble with that."})

        llm.register_function("ask_brain", handle_ask_brain)
        all_tools = [ask_brain_func]
        tools = ToolsSchema(standard_tools=all_tools)
        logger.info("Phone Tools: Cerebras mode — ask_brain → Brain")
    else:
        from skills import get_all_skill_schemas, register_all_skills
        register_all_skills(llm)
        all_tools = [search_web_func, send_whatsapp_func, send_email_func] + get_all_skill_schemas()
        tools = ToolsSchema(standard_tools=all_tools)
        logger.info(f"Phone Tools: Gemini mode — {len(all_tools)} functions")

    # --- Context ---
    context = LLMContext(messages=messages, tools=tools)
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)

    # --- Transport: FastAPI WebSocket (direct Twilio connection, no proxy) ---
    serializer = AutoStreamSidTwilioSerializer(
        stream_sid=stream_sid or "pending",
        call_sid=call_sid or "pending",  # Auto-captured from 'start' event
        account_sid=os.getenv("TWILIO_ACCOUNT_SID"),
        auth_token=os.getenv("TWILIO_AUTH_TOKEN"),
    )

    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            serializer=serializer,
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        ),
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
    async def on_client_connected(transport, ws):
        logger.info(f"Phone call connected (FastAPI): {to_number}")
        greetings = {
            "yue": "你好，我係水療中心嘅助手，打嚟確認你嘅預約。請問你聽日方唔方便過嚟呢？",
            "en": "Hi, this is a call from SPA Collection. I'm calling to confirm your appointment. Is tomorrow still good for you?",
        }
        greeting = greetings.get(call_lang, greetings["en"])
        await task.queue_frames([TextFrame(text=greeting)])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, ws):
        logger.info(f"Phone call disconnected (FastAPI): {to_number}")
        await task.queue_frame(EndFrame())

    runner = PipelineRunner()
    await runner.run(task)
