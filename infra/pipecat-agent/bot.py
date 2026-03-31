"""
Pipecat Voice AI Agent — Full-duplex conversation
Uses: Deepgram STT + Gemini Flash LLM + multi-provider TTS + Daily WebRTC
Google Search grounding + function calling (open_url)
"""
import asyncio
import os
import sys
import time

from pipecat.frames.frames import LLMMessagesFrame, EndFrame, TextFrame, TranscriptionFrame, UserStartedSpeakingFrame
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.transports.daily.transport import DailyOutputTransportMessageFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.adapters.schemas.tools_schema import ToolsSchema, AdapterType
from pipecat.services.llm_service import FunctionCallParams
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


class STTLatencyMonitor(FrameProcessor):
    """Monitors STT TTFB and forces reconnection when latency exceeds threshold.
    Detects degradation before the user notices and recycles the connection."""
    def __init__(self, stt_service, threshold=3.0, name="STTLatencyMonitor"):
        super().__init__(name=name)
        self._stt = stt_service
        self._threshold = threshold
        self._speech_start = None
        self._recycling = False

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        if isinstance(frame, UserStartedSpeakingFrame):
            # User turn started — record timestamp for TTFB measurement
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


class AutoTTSVoiceSwapper(FrameProcessor):
    """Auto-swaps TTS voice based on detected language from Azure auto-detect STT.
    Reads TranscriptionFrame.language and updates tts._settings.voice accordingly.
    Safe mid-call — voice is read fresh per TTS synthesis call."""
    # Native voices for languages that need them (not Jenny multilingual)
    VOICE_MAP = {
        "zh-HK": "zh-HK-WanLungNeural",      # Cantonese
        "vi-VN": "vi-VN-HoaiMyNeural",         # Vietnamese
    }
    MULTILINGUAL_VOICE = "en-US-JennyMultilingualNeural"

    def __init__(self, tts_service, name="AutoTTSVoiceSwapper"):
        super().__init__(name=name)
        self._tts = tts_service
        self._current_lang = None

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        if isinstance(frame, TranscriptionFrame):
            lang = getattr(frame, 'language', None)
            if lang:
                # Convert to string for matching — could be Language enum or string
                lang_str = str(lang)
                if lang_str != self._current_lang:
                    self._current_lang = lang_str
                    logger.info(f"AutoTTSVoiceSwapper: detected language = '{lang_str}' (type: {type(lang).__name__})")
                    new_voice = self.VOICE_MAP.get(lang_str, self.MULTILINGUAL_VOICE)
                    old_voice = self._tts._settings.voice
                    if new_voice != old_voice:
                        self._tts._settings.voice = new_voice
                        logger.info(f"Auto TTS voice swap: {old_voice} → {new_voice}")
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


from stt_utils import AutoDetectAzureSTTService


async def main():
    room_url = os.getenv("DAILY_ROOM_URL")
    daily_api_key = os.getenv("DAILY_API_KEY")

    if not room_url:
        logger.error("DAILY_ROOM_URL not set")
        return

    # --- Transport: Daily WebRTC ---
    transport = DailyTransport(
        room_url,
        None,
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

    # --- STT ---
    lang = os.getenv("VOICE_LANG", "en")
    # Deepgram Nova-3 languages (fast, <300ms)
    DEEPGRAM_LANGUAGES = {
        "en": "en",
        "vi": "vi",
        "zh": "zh",
        "ja": "ja",
        "ko": "ko",
        "fr": "fr",
        "es": "es",
        "de": "de",
    }
    # Azure STT only for Cantonese (Deepgram doesn't support zh-HK well)
    AZURE_STT_LANGUAGES = {
        "yue": "zh-HK",
    }
    if lang == "auto":
        # Auto-detect language using Azure continuous language ID
        stt = AutoDetectAzureSTTService.create(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            candidate_languages=["en-US", "zh-HK", "zh-CN", "vi-VN", "ja-JP", "ko-KR", "fr-FR", "es-ES", "de-DE"],
            sample_rate=24000,
        )
        logger.info("STT: Azure Auto-Detect (en/yue/zh/vi/ja/ko/fr/es/de)")
    elif lang in AZURE_STT_LANGUAGES:
        from pipecat.services.azure.stt import AzureSTTService
        azure_lang = AZURE_STT_LANGUAGES[lang]
        stt = AzureSTTService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            language=azure_lang,
            sample_rate=24000,
        )
        logger.info(f"STT: Azure ({azure_lang})")
    else:
        # Deepgram Nova-3 — language MUST be set via settings, not constructor kwarg
        dg_lang = DEEPGRAM_LANGUAGES.get(lang, "en")
        stt = DeepgramSTTService(
            api_key=os.getenv("DEEPGRAM_API_KEY"),
            settings=DeepgramSTTService.Settings(language=dg_lang),
        )
        logger.info(f"STT: Deepgram ({dg_lang})")

    # --- LLM: Gemini Flash ---
    from pipecat.services.google.llm import GoogleLLMService
    llm = GoogleLLMService(
        api_key=os.getenv("GOOGLE_GEMINI_API_KEY"),
        model="gemini-2.0-flash",
    )

    # --- TTS ---
    tts_provider = os.getenv("TTS_PROVIDER", "azure")
    tts_voice = os.getenv("TTS_VOICE", "")

    # Languages that need native Azure voices (not Jenny multilingual)
    NATIVE_VOICE_DEFAULTS = {
        "yue": "zh-HK-WanLungNeural",
        "vi": "vi-VN-HoaiMyNeural",
    }
    if lang in NATIVE_VOICE_DEFAULTS:
        from pipecat.services.azure.tts import AzureTTSService
        native_voice = tts_voice or NATIVE_VOICE_DEFAULTS[lang]
        tts = AzureTTSService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            voice=native_voice,
            sample_rate=24000,
        )
        logger.info(f"TTS: Azure native ({native_voice})")
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

    # Map lang code to name for system prompt
    LANG_NAMES = {
        "en": "English", "zh": "Mandarin Chinese", "yue": "Cantonese",
        "ja": "Japanese", "ko": "Korean", "fr": "French", "es": "Spanish", "de": "German", "vi": "Vietnamese",
    }

    if lang == "yue":
        system_content = f"""你係一個語音AI助手。你講嘢要好似真人打電話咁，唔好似機械人。
今日係{today}，而家時間係{current_time}。

規則：
- 每次回覆最多1-2句，要簡潔
- 一定要用廣東話口語：用「係」唔好用「是」，用「嘅」唔好用「的」，用「咁」唔好用「這樣」
- 自然啲回應：「嗯...」「哦！」「明白」「係喎」
- 唔好用markdown、列表、星號。呢個係講嘢，唔係打字
- 語氣要親切友善，好似同朋友傾計咁"""
    elif lang == "zh":
        system_content = f"""你是一个语音AI助手。你说话要像真人打电话一样，不要像机器人。
今天是{today}，现在时间是{current_time}。

你有这些工具：
1. search_web(query) — 搜索网络获取最新信息。
2. open_url(url) — 在用户屏幕上打开网站。
3. send_whatsapp(phone, message) — 发送WhatsApp消息。
4. make_call(phone) — 拨打电话。
5. send_email(to, subject, body) — 打开邮件编辑。
6. switch_language(language) — 切换语言，通话会自动重启。
7. translate(target_language) — 实时翻译模式。

规则：
- 每次回复最多1-2句，要简洁
- 一定要用中文普通话回应
- 自然的回应：「嗯...」「哦！」「好的」「明白」
- 不要用markdown、列表、星号。这是说话，不是打字
- 语气要亲切友善，像同事聊天一样"""
    elif lang == "auto":
        lang_instruction = "Auto-detect the language the user speaks and ALWAYS respond in that SAME language. If they speak Cantonese, respond in Cantonese using colloquial Cantonese (用「係」唔好用「是」). If they speak English, respond in English. If they speak Mandarin, respond in Mandarin. Match their language exactly."
    else:
        lang_name = LANG_NAMES.get(lang, "English")
        lang_instruction = f"You MUST respond in {lang_name}. The user has selected {lang_name} as their language." if lang != "en" else "Detect what language the user speaks and respond in the same language."

    if lang not in ("yue", "zh"):
        system_content = f"""You are a voice AI assistant. You speak like a real person in a phone call — not a chatbot.
Today's date is {today}. The current time is {current_time}.

{lang_instruction}

You have these tools:
1. search_web(query) — search the internet for current info like prices, news, weather.
2. open_url(url) — open a website on the user's screen.
3. send_whatsapp(phone, message) — send a real WhatsApp message.
4. make_call(phone) — dial a phone number.
5. send_email(to, subject, body) — open email compose.
6. switch_language(language) — switch the call to a different language. This will restart the call with the correct voice and speech recognition for that language. Say a brief goodbye before switching.
7. translate(target_language) — become a real-time translator. Translate everything the user says into the target language.

Rules:
- Keep replies to 1-2 sentences max. Be concise.
- Use natural fillers occasionally.
- No markdown, no lists, no asterisks. This is spoken language.
- Sound warm and friendly, like talking to a colleague.
- When user asks to switch language, call switch_language() — the call will restart automatically with the right settings.
- After searching, summarize the key finding naturally. Don't read out URLs."""

    messages = [{"role": "system", "content": system_content}]

    # --- Function calling: open_url ---
    open_url_func = FunctionSchema(
        name="open_url",
        description="Open a URL on the user's device. Use for websites (https://cnn.com), phone calls (tel:+852...), WhatsApp (https://wa.me/852...), email (mailto:...), or maps.",
        properties={
            "url": {
                "type": "string",
                "description": "The full URL to open, e.g. https://www.cnn.com or tel:+85291234567"
            }
        },
        required=["url"],
    )

    # Handler for open_url
    async def handle_open_url(params: FunctionCallParams):
        url = params.arguments.get("url", "")
        if not url.startswith(("http", "tel:", "mailto:", "geo:")):
            url = "https://" + url
        logger.info(f"Opening URL: {url}")
        try:
            await transport.output().send_message(DailyOutputTransportMessageFrame(message={"type": "open-url", "url": url}))
        except Exception as e:
            logger.error(f"Could not send URL to browser: {e}")
        await params.result_callback({"status": "opened", "url": url})

    llm.register_function("open_url", handle_open_url)

    # --- Function calling: search_web ---
    search_web_func = FunctionSchema(
        name="search_web",
        description="Search the web and return results. Use when user asks for current info like prices, news, weather, facts, research, etc. Returns text content that you should summarize by voice.",
        properties={
            "query": {
                "type": "string",
                "description": "The search query, e.g. 'oil price today' or 'latest AI news'"
            }
        },
        required=["query"],
    )

    async def handle_search_web(params: FunctionCallParams):
        import aiohttp
        query = params.arguments.get("query", "")
        logger.info(f"Searching web: {query}")
        try:
            url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    html = await resp.text()
            # Extract text from HTML (simple approach, no BeautifulSoup needed)
            import re
            text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            result = text[:3000]
            logger.info(f"Search result: {result[:200]}...")
            await params.result_callback({"results": result, "query": query})
        except Exception as e:
            logger.error(f"Search error: {e}")
            await params.result_callback({"error": str(e), "query": query})

    llm.register_function("search_web", handle_search_web)

    # --- Function calling: send_whatsapp ---
    send_whatsapp_func = FunctionSchema(
        name="send_whatsapp",
        description="Send a WhatsApp message to a phone number. Use when user says 'message John on WhatsApp', 'send a WhatsApp to 852...', etc.",
        properties={
            "phone": {
                "type": "string",
                "description": "Phone number with country code, e.g. 85296099766"
            },
            "message": {
                "type": "string",
                "description": "The message text to send"
            }
        },
        required=["phone", "message"],
    )

    async def handle_send_whatsapp(params: FunctionCallParams):
        import aiohttp
        phone = params.arguments.get("phone", "").replace("+", "").replace(" ", "").replace("-", "")
        message = params.arguments.get("message", "")
        whapi_token = os.getenv("WHAPI_TOKEN", "")
        logger.info(f"Sending WhatsApp to {phone}: {message[:50]}...")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://gate.whapi.cloud/messages/text",
                    headers={"Authorization": f"Bearer {whapi_token}", "Content-Type": "application/json"},
                    json={"to": phone, "body": message},
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    result = await resp.json()
                    logger.info(f"WhatsApp API response: {resp.status} {result}")
                    if resp.status == 200 or resp.status == 201:
                        await params.result_callback({"status": "sent", "phone": phone})
                    else:
                        await params.result_callback({"status": "failed", "error": str(result)})
        except Exception as e:
            logger.error(f"WhatsApp send error: {e}")
            await params.result_callback({"status": "failed", "error": str(e)})

    llm.register_function("send_whatsapp", handle_send_whatsapp)

    # --- Function calling: make_call ---
    make_call_func = FunctionSchema(
        name="make_call",
        description="Initiate a phone call. Opens the phone dialer on the user's device.",
        properties={
            "phone": {
                "type": "string",
                "description": "Phone number with country code, e.g. +85296099766"
            }
        },
        required=["phone"],
    )

    async def handle_make_call(params: FunctionCallParams):
        phone = params.arguments.get("phone", "")
        if not phone.startswith("+"):
            phone = "+" + phone
        url = f"tel:{phone}"
        logger.info(f"Making call: {url}")
        try:
            await transport.output().send_message(DailyOutputTransportMessageFrame(message={"type": "open-url", "url": url}))
        except Exception as e:
            logger.error(f"Could not trigger call: {e}")
        await params.result_callback({"status": "dialing", "phone": phone})

    llm.register_function("make_call", handle_make_call)

    # --- Function calling: send_email ---
    send_email_func = FunctionSchema(
        name="send_email",
        description="Open an email compose window on the user's device.",
        properties={
            "to": {
                "type": "string",
                "description": "Email address"
            },
            "subject": {
                "type": "string",
                "description": "Email subject line"
            },
            "body": {
                "type": "string",
                "description": "Email body text"
            }
        },
        required=["to"],
    )

    async def handle_send_email(params: FunctionCallParams):
        import urllib.parse
        to = params.arguments.get("to", "")
        subject = urllib.parse.quote(params.arguments.get("subject", ""))
        body = urllib.parse.quote(params.arguments.get("body", ""))
        url = f"mailto:{to}?subject={subject}&body={body}"
        logger.info(f"Sending email: {url[:100]}")
        try:
            await transport.output().send_message(DailyOutputTransportMessageFrame(message={"type": "open-url", "url": url}))
        except Exception as e:
            logger.error(f"Could not trigger email: {e}")
        await params.result_callback({"status": "opened", "to": to})

    llm.register_function("send_email", handle_send_email)

    # --- Function calling: switch_language ---
    # Only Cantonese needs a special voice — multilingual handles all others
    LANGUAGE_VOICES = {
        "cantonese": "zh-HK-WanLungNeural",
        "vietnamese": "vi-VN-HoaiMyNeural",
    }
    MULTILINGUAL_VOICE = "en-US-JennyMultilingualNeural"

    switch_language_func = FunctionSchema(
        name="switch_language",
        description="Switch the AI's speaking language. Use when user says 'speak Mandarin', 'switch to Japanese', 'talk in French', etc. After switching, respond in the new language.",
        properties={
            "language": {
                "type": "string",
                "description": "Target language: english, mandarin, cantonese, japanese, korean, french, spanish, german, vietnamese"
            }
        },
        required=["language"],
    )

    # Map language names to lang codes for restart
    LANGUAGE_CODES = {
        "english": "en",
        "mandarin": "zh",
        "cantonese": "yue",
        "japanese": "ja",
        "korean": "ko",
        "french": "fr",
        "spanish": "es",
        "german": "de",
        "vietnamese": "vi",
    }

    async def handle_switch_language(params: FunctionCallParams):
        language = params.arguments.get("language", "english").lower()
        lang_code = LANGUAGE_CODES.get(language, "en")
        logger.info(f"Switching language to {language} (code: {lang_code}) — sending restart to browser")
        # Tell the browser to switch language and restart the call
        try:
            await transport.output().send_message(
                DailyOutputTransportMessageFrame(message={
                    "type": "switch-language",
                    "lang": lang_code,
                })
            )
        except Exception as e:
            logger.error(f"Could not send switch-language to browser: {e}")
        await params.result_callback({
            "status": "restarting",
            "language": language,
            "instruction": f"The call is restarting with {language} language settings. Say a brief goodbye in the current language."
        })

    llm.register_function("switch_language", handle_switch_language)

    # --- Function calling: translate ---
    translate_func = FunctionSchema(
        name="translate",
        description="Start real-time translation mode. The user speaks in their language, and you translate and speak in the target language. Use when user says 'translate to Mandarin', 'be my interpreter for Japanese', etc.",
        properties={
            "target_language": {
                "type": "string",
                "description": "The language to translate INTO: english, mandarin, cantonese, japanese, korean, french, spanish, german"
            }
        },
        required=["target_language"],
    )

    async def handle_translate(params: FunctionCallParams):
        target = params.arguments.get("target_language", "english").lower()
        voice = LANGUAGE_VOICES.get(target, MULTILINGUAL_VOICE)
        logger.info(f"Translation mode: translating to {target}, voice: {voice}")
        try:
            tts._settings.voice = voice
        except Exception as e:
            logger.error(f"Could not update TTS voice: {e}")
        await params.result_callback({
            "status": "translating",
            "target_language": target,
            "instruction": f"TRANSLATION MODE ACTIVE. From now on, EVERY response must be in {target} ONLY. No matter what language the user speaks, always translate into {target}. NEVER respond in the user's language. NEVER add commentary. Just output the translation. Stay in this mode until the user says 'stop translating' or 'switch to English'."
        })

    llm.register_function("translate", handle_translate)

    # --- Tools: all functions ---
    tools = ToolsSchema(standard_tools=[
        open_url_func, search_web_func, send_whatsapp_func, make_call_func, send_email_func,
        switch_language_func, translate_func
    ])
    logger.info("Tools: 7 functions enabled")

    # --- Context (universal, not deprecated OpenAILLMContext) ---
    context = LLMContext(messages=messages, tools=tools)
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)

    # --- STT Latency Monitor (auto-recycle on degradation) ---
    stt_monitor = STTLatencyMonitor(stt_service=stt, threshold=3.0)

    # --- Auto TTS Voice Swapper (only for auto-detect mode) ---
    auto_voice_swapper = AutoTTSVoiceSwapper(tts_service=tts) if lang == "auto" else None

    # --- Pipeline ---
    stt_processors = [stt, stt_monitor]
    if auto_voice_swapper:
        stt_processors.append(auto_voice_swapper)
    stt_processors.append(STTForwarder())

    pipeline = Pipeline(
        [
            transport.input(),
            *stt_processors,
            user_aggregator,
            llm,
            CJKSpaceFixer(),
            LLMForwarder(),
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
        ),
    )

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"Participant joined: {participant['id']}")
        from pipecat.frames.frames import LLMRunFrame
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant left: {participant['id']}")
        await task.queue_frame(EndFrame())

    runner = PipelineRunner()
    await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
