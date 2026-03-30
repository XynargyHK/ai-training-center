"""
Pipecat Voice AI Agent — Full-duplex conversation
Uses: Deepgram STT + Cerebras/Gemini LLM + Cartesia/Azure TTS + Daily WebRTC
Supports web search via DuckDuckGo (English mode)
"""
import asyncio
import os
import sys

from pipecat.frames.frames import LLMMessagesFrame, EndFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
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

try:
    from duckduckgo_search import DDGS
    HAS_SEARCH = True
except ImportError:
    HAS_SEARCH = False

from loguru import logger

try:
    logger.remove(0)
except ValueError:
    pass
logger.add(sys.stderr, level="DEBUG")


def web_search(query: str, max_results: int = 3) -> str:
    """Search the web using DuckDuckGo and return summarized results."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return "No results found."
        lines = []
        for r in results:
            lines.append(f"- {r['title']}: {r['body']}")
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Web search error: {e}")
        return f"Search failed: {str(e)}"


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
    from datetime import datetime
    today = datetime.now().strftime("%B %d, %Y")

    if lang == "yue":
        system_content = f"""你係一個語音AI助手。你講嘢要好似真人打電話咁，唔好似機械人。
今日係{today}。

規則：
- 每次回覆最多1-2句，要簡潔
- 一定要用廣東話口語：用「係」唔好用「是」，用「嘅」唔好用「的」，用「咁」唔好用「這樣」
- 自然啲回應：「嗯...」「哦！」「明白」「係喎」
- 唔好用markdown、列表、星號。呢個係講嘢，唔係打字
- 語氣要親切友善，好似同朋友傾計咁"""
    else:
        system_content = f"""You are a voice AI assistant. You speak like a real person in a phone call — not a chatbot.
Today's date is {today}.

You have access to web search. When the user asks about current events, news, prices, weather, facts you're not sure about, or anything that needs up-to-date information, use the web_search function. Say something like "let me look that up" before searching.

Rules:
- Keep replies to 1-2 sentences max. Be concise.
- Use natural fillers occasionally: "hmm", "well", "you know", "let me think..."
- Use contractions: "I'm", "don't", "can't", "it's"
- React naturally: laugh ("haha"), express surprise ("oh wow"), show empathy ("ah I see")
- No markdown, no lists, no asterisks. This is spoken language.
- Sound warm and friendly, like talking to a colleague.
- After a web search, summarize the key finding in 1-2 natural sentences. Don't read out URLs."""

    messages = [{"role": "system", "content": system_content}]

    # --- Web search tool (English mode only, if duckduckgo available) ---
    tools = None
    if lang != "yue" and HAS_SEARCH:
        try:
            from google.genai.types import FunctionDeclaration, Tool
            search_func = FunctionDeclaration(
                name="web_search",
                description="Search the web for current information. Use this when the user asks about recent events, facts you're unsure about, prices, news, weather, or anything that needs up-to-date information.",
                parameters={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query"
                        }
                    },
                    "required": ["query"]
                }
            )
            tools = [Tool(function_declarations=[search_func])]

            async def handle_web_search(params):
                query = params.arguments.get("query", "")
                logger.info(f"Web search triggered: {query}")
                results = await asyncio.get_event_loop().run_in_executor(None, web_search, query)
                logger.info(f"Web search results: {results[:200]}")
                await params.result_callback({"results": results})

            llm.register_function("web_search", handle_web_search)
            logger.info("Web search tool registered successfully")
        except Exception as e:
            logger.error(f"Failed to register web search tool: {e}")
            tools = None

    # Create LLM context and aggregator pair for conversation management
    context = OpenAILLMContext(messages, tools=tools)
    context_aggregator = llm.create_context_aggregator(context)

    # --- Pipeline: STT → UserAggregator → LLM → TTS → AssistantAggregator ---
    pipeline = Pipeline(
        [
            transport.input(),                    # audio from user (WebRTC)
            stt,                                  # speech-to-text
            context_aggregator.user(),            # collects user speech, sends to LLM
            llm,                                  # language model
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
