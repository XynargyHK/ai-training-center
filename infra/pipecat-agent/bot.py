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

import aiohttp
from bs4 import BeautifulSoup
from loguru import logger

try:
    logger.remove(0)
except ValueError:
    pass
logger.add(sys.stderr, level="DEBUG")


async def fetch_webpage(url: str, max_chars: int = 3000) -> str:
    """Fetch a webpage and extract readable text content."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    return f"Error: HTTP {resp.status}"
                html = await resp.text()
        soup = BeautifulSoup(html, "html.parser")
        # Remove scripts, styles, nav
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        # Clean up whitespace
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        clean = "\n".join(lines)
        return clean[:max_chars]
    except Exception as e:
        logger.error(f"Webpage fetch error: {e}")
        return f"Failed to fetch: {str(e)}"


class InfoDisplayProcessor(FrameProcessor):
    """Sends search/info results to browser when AI uses Google Search grounding."""

    def __init__(self, transport):
        super().__init__()
        self._transport = transport
        self._ai_text = ""
        self._has_grounding = False

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if isinstance(frame, TextFrame):
            self._ai_text += frame.text

        elif isinstance(frame, TranscriptionFrame):
            # New user speech — clear previous info and reset
            self._ai_text = ""
            self._has_grounding = False
            try:
                await self._transport.send_app_message({"type": "clear-info"})
            except Exception:
                pass

        # Check for grounding/search metadata frames
        # Pipecat may pass through various frame types from Google
        frame_name = type(frame).__name__
        if "grounding" in frame_name.lower() or "search" in frame_name.lower():
            self._has_grounding = True
            logger.info(f"Grounding frame detected: {frame_name}")

        # When we see an EndFrame or LLM end, send accumulated text if it looks like search info
        if frame_name in ("LLMFullResponseEndFrame", "LLMResponseEndFrame") or isinstance(frame, EndFrame):
            if self._ai_text.strip() and len(self._ai_text) > 80:
                # Longer responses likely contain search info — display it
                try:
                    await self._transport.send_app_message({
                        "type": "info",
                        "text": self._ai_text.strip()
                    })
                    logger.info(f"Sent info to browser: {self._ai_text[:100]}...")
                except Exception as e:
                    logger.debug(f"Could not send info: {e}")
            self._ai_text = ""

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

You can browse the internet using fetch_webpage. Use it when the user asks to:
- Visit a website: fetch_webpage("https://www.cnn.com")
- Search for info: fetch_webpage("https://www.google.com/search?q=latest+AI+news")
- Read an article: fetch_webpage with the article URL

The fetched content appears on the user's screen automatically. Summarize key points by voice.

Rules:
- Keep replies to 1-2 sentences max. Be concise.
- Use natural fillers occasionally: "hmm", "well", "you know", "let me think..."
- Use contractions: "I'm", "don't", "can't", "it's"
- React naturally: laugh ("haha"), express surprise ("oh wow"), show empathy ("ah I see")
- No markdown, no lists, no asterisks. This is spoken language.
- Sound warm and friendly, like talking to a colleague.
- After searching, summarize the key finding naturally. Don't read out URLs."""

    messages = [{"role": "system", "content": system_content}]

    # --- Tools: Google Search + webpage fetch ---
    tools = None
    try:
        from google.genai import types as gtypes

        fetch_func = gtypes.FunctionDeclaration(
            name="fetch_webpage",
            description="Fetch and read the content of a specific webpage URL. Use when the user asks to go to a website, read an article, or check a specific URL like cnn.com, bbc.com, etc.",
            parameters=gtypes.Schema(
                type=gtypes.Type.OBJECT,
                properties={
                    "url": gtypes.Schema(
                        type=gtypes.Type.STRING,
                        description="The full URL to fetch, e.g. https://www.cnn.com"
                    )
                },
                required=["url"]
            )
        )

        # Note: google_search grounding can't be mixed with function_declarations
        # So we keep only fetch_webpage as a function tool
        tools = [
            gtypes.Tool(function_declarations=[fetch_func]),
        ]

        async def handle_fetch_webpage(params):
            url = params.arguments.get("url", "")
            if not url.startswith("http"):
                url = "https://" + url
            logger.info(f"Fetching webpage: {url}")
            content = await fetch_webpage(url)
            logger.info(f"Fetched {len(content)} chars from {url}")
            # Send to browser info frame
            try:
                await transport.send_app_message({
                    "type": "info",
                    "text": content[:2000],
                    "source": url
                })
            except Exception:
                pass
            await params.result_callback({"content": content, "url": url})

        llm.register_function("fetch_webpage", handle_fetch_webpage)
        logger.info("Google Search + webpage fetch tools enabled")
    except Exception as e:
        logger.error(f"Could not set up tools: {e}")
        tools = None

    # Create LLM context and aggregator pair for conversation management
    context = OpenAILLMContext(messages, tools=tools)
    context_aggregator = llm.create_context_aggregator(context)

    # --- Info display: shows search results in browser frame ---
    info_display = InfoDisplayProcessor(transport)

    # --- Pipeline ---
    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            info_display,                         # clears frame on new user speech
            context_aggregator.user(),
            llm,
            InfoDisplayProcessor(transport),       # captures AI text, sends to frame if info
            tts,
            transport.output(),
            context_aggregator.assistant(),
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
