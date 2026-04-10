"""
Pipecat Voice AI Agent — Full-duplex conversation
Supports both browser and phone calls through the same pipeline.
All tools are modular (tools/*.py). bot.py is just pipeline wiring.

Transport: LiveKit (migrated from Daily)
"""
import asyncio
import os
import sys

from pipecat.frames.frames import EndFrame, TextFrame, TranscriptionFrame
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.services.deepgram.stt import DeepgramSTTService

from pipecat.transports.livekit.transport import (
    LiveKitTransport,
    LiveKitParams,
    LiveKitOutputTransportMessageFrame,
)

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
    """Sends user speech transcripts to browser via LiveKit data channel."""
    def __init__(self, name="STTForwarder"):
        super().__init__(name=name)

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        if isinstance(frame, TranscriptionFrame):
            msg = LiveKitOutputTransportMessageFrame(message={"type": "stt", "text": frame.text})
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
    """Sends AI response text to browser via LiveKit data channel."""
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
            msg = LiveKitOutputTransportMessageFrame(message={"type": "llm", "text": self._text})
            await self.push_frame(msg, FrameDirection.DOWNSTREAM)
        await self.push_frame(frame, direction)


async def run_pipeline(
    room_name,
    token=None,
    lang="en",
    mode="browser",
    dialout_settings=None,
    vision_enabled=False,
    greeting=None,
):
    """Run the voice AI pipeline.

    Args:
        room_name: LiveKit room name
        token: LiveKit access token (JWT)
        lang: language code (en, yue, zh, etc.)
        mode: "browser" or "phone"
        dialout_settings: dict with SIP dialout config or None
        vision_enabled: whether to capture video (browser only)
        greeting: optional greeting text to speak first (for phone calls)
    """
    livekit_url = os.getenv("LIVEKIT_URL")

    if not room_name:
        logger.error("room_name is required")
        return

    if not token:
        logger.error("token is required")
        return

    # Phone mode never uses vision
    if mode == "phone":
        vision_enabled = False

    participant_id_ref = [None]

    # --- Transport: LiveKit WebRTC ---
    transport = LiveKitTransport(
        url=livekit_url,
        token=token,
        room_name=room_name,
        params=LiveKitParams(
            audio_out_enabled=True,
            audio_out_sample_rate=24000,
            audio_in_enabled=True,
            video_in_enabled=vision_enabled,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        ),
    )

    # --- STT: Azure for Cantonese (accurate), Deepgram for everything else (fast) ---
    if lang == "yue":
        from pipecat.services.azure.stt import AzureSTTService
        stt = AzureSTTService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastasia"),
            language="zh-HK",
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
        # Voice selectable via VOICE_CANTONESE_FEMALE env var (set by /dialcantonese).
        # Options: zh-HK-HiuMaanNeural (default) or zh-HK-HiuGaaiNeural — both female.
        selected_yue_voice = os.getenv("VOICE_CANTONESE_FEMALE", "zh-HK-HiuMaanNeural")
        if selected_yue_voice not in ("zh-HK-HiuMaanNeural", "zh-HK-HiuGaaiNeural"):
            selected_yue_voice = "zh-HK-HiuMaanNeural"
        from pipecat.services.azure.tts import AzureTTSService
        tts = AzureTTSService(
            api_key=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION", "eastus"),
            voice=selected_yue_voice,
            sample_rate=24000,
        )
        logger.info(f"Cantonese TTS voice: {selected_yue_voice}")
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
        system_content = f"""你係一個廣東話語音AI助手，而家打緊電話。你講嘢好似真人一樣——親切、專業、簡潔。
今日係{today}，而家時間係{current_time}。

【廣東話口語守則 — 一定要跟】

1. 只可以用地道廣東話口語，唔可以用書面語：
   - 用「係」，唔好用「是」
   - 用「嘅」，唔好用「的」
   - 用「咗」，唔好用「了」
   - 用「唔」，唔好用「不」
   - 用「咁」，唔好用「這樣」
   - 用「而家」，唔好用「現在」
   - 用「點解」，唔好用「為什麼」
   - 用「點樣」，唔好用「怎樣」
   - 用「邊度」，唔好用「哪裡」
   - 用「幾多」，唔好用「多少」
   - 用「睇」，唔好用「看」
   - 用「食」，唔好用「吃」
   - 用「飲」，唔好用「喝」
   - 用「畀」，唔好用「給」
   - 用「喺」，唔好用「在」
   - 用「同」，唔好用「和」/「跟」
   - 用「嚟」，唔好用「來」
   - 用「去」係用「去」
   - 用「識」，唔好用「會」（當表達「懂得」嘅時候）

2. 絕對唔可以用英文！一個英文字都唔好講！全部用廣東話：
   - check = 睇吓
   - OK = 好嘅 / 冇問題
   - sorry = 唔好意思 / 對唔住
   - thank you = 多謝你
   - thanks = 多謝
   - please = 唔該
   - yes = 係呀
   - no = 唔係 / 唔係呀
   - sure = 冇問題 / 梗係
   - wait = 等陣 / 等等
   - hello = 你好 / 喂
   - bye = 拜拜
   - appointment = 預約
   - confirm = 確認
   - booking = 訂位
   - book = 預約 / 訂
   - time = 時間
   - morning = 朝早
   - afternoon = 下晝
   - evening = 夜晚 / 晚黑
   - tomorrow = 聽日
   - today = 今日
   - yesterday = 琴日
   - information = 資料
   - available = 得閒 / 有得
   - convenient = 方便
   - schedule = 安排
   - cancel = 取消
   - change = 改
   - right = 啱
   - understand = 明白
   - need = 要
   - want = 想
   - can = 可以 / 得
   - cannot = 唔得 / 唔可以
   - know = 知道 / 識
   - good = 好
   - great = 好好 / 正
   - now = 而家

3. 用自然嘅廣東話語氣詞：
   - 「嗯...」表示諗緊
   - 「哦！」表示明白咗
   - 「係喎」表示認同
   - 「唉呀」表示抱歉
   - 「好嘅」答應
   - 「冇問題嘅」爽快應承
   - 「明白明白」強調明白
   - 「咁...」轉話題

4. 句尾要加語氣詞，先似真人：
   - 「呀」「啦」「喎」「囉」「咯」「㗎」「嘅」
   - 例：「好呀」「明白啦」「係喎」「唔使咁客氣嘅」

5. 講嘢風格：
   - 每次最多 1-2 句，短句先自然
   - 唔好用書面嘅長句結構
   - 電話對話要簡潔，唔好長篇大論
   - 語氣親切，好似同朋友傾計咁
   - 唔好太正式，唔好用「您」，用「你」
   - 絕對唔好用 markdown、列表、星號、符號

6. 發音注意：
   - 有啲字書面版本同口語版本唔同，記得用口語版：
     - 「看一看」→「睇下」或「睇吓」
     - 「吃飯」→「食飯」
     - 「知道」口語可以講「知」或「識」
     - 「一點」→「少少」
     - 「非常」→「好」或「非常之」

記住：一個英文字都唔好出現！用最地道嘅廣東話口語，好似真係住喺香港嘅人咁。"""
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
        @transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport_obj, participant_id):
            logger.info(f"Phone mode: first participant joined: {participant_id}")
            # In phone mode with LiveKit SIP, the SIP participant connects as a regular participant.
            # Trigger LLM greeting when the callee joins.
            from pipecat.frames.frames import LLMRunFrame
            logger.info(f"Phone participant joined — triggering LLM greeting ({lang})")
            await task.queue_frames([LLMRunFrame()])

        @transport.event_handler("on_participant_left")
        async def on_participant_left(transport_obj, participant_id, reason):
            logger.info(f"Phone participant left: {participant_id}, reason: {reason}")
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
        async def on_first_participant_joined(transport_obj, participant_id):
            logger.info(f"Participant joined: {participant_id}")
            participant_id_ref[0] = participant_id
            if vision_enabled:
                await transport_obj.capture_participant_video(
                    participant_id,
                    framerate=0,
                    video_source="camera",
                    color_format="RGB",
                )
                logger.info(f"Vision: capturing video from {participant_id} (on-demand)")
            from pipecat.frames.frames import LLMRunFrame
            await task.queue_frames([LLMRunFrame()])

        @transport.event_handler("on_participant_left")
        async def on_participant_left(transport_obj, participant_id, reason):
            logger.info(f"Participant left: {participant_id}")
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
    room_name = os.getenv("LIVEKIT_ROOM_NAME", "test-room")
    token = os.getenv("LIVEKIT_TOKEN", "")

    # If no pre-generated token, generate one
    if not token:
        from livekit.api import AccessToken, VideoGrants
        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")
        if api_key and api_secret:
            at = AccessToken(api_key, api_secret)
            at.with_identity("ai-assistant")
            at.with_name("AI Assistant")
            at.with_grants(VideoGrants(
                room_join=True,
                room=room_name,
            ))
            token = at.to_jwt()
        else:
            logger.error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET required to generate token")
            return

    lang = os.getenv("VOICE_LANG", "en")
    vision = os.getenv("VISION_ENABLED", "false").lower() == "true"
    await run_pipeline(room_name=room_name, token=token, lang=lang, mode="browser", vision_enabled=vision)


if __name__ == "__main__":
    asyncio.run(main())
