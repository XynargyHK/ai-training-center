"""
HTTP server for Voice AI (FastAPI + uvicorn):
- POST /start → creates Daily room + spawns browser voice bot
- POST /start-vision → creates Daily room + spawns vision bot
- POST /dialout → makes outbound phone call via Twilio + phone bot on /ws
- POST /twiml → returns TwiML XML for Twilio to connect WebSocket
- GET /ws → Twilio WebSocket (FastAPIWebsocketTransport, no proxy)
- GET /health, GET /proxy
"""
import os
import asyncio
import time
import json
import base64

import aiohttp
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse, Response, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_API_URL = "https://api.daily.co/v1"

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def create_daily_room():
    """Create a temporary Daily room for the voice session."""
    headers = {"Authorization": f"Bearer {DAILY_API_KEY}", "Content-Type": "application/json"}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{DAILY_API_URL}/rooms",
            headers=headers,
            json={
                "properties": {
                    "exp": int(time.time()) + 3600,
                    "enable_chat": False,
                    "enable_screenshare": False,
                    "max_participants": 2,
                }
            },
        ) as resp:
            data = await resp.json()
            print(f"Daily API response: {resp.status} {data}")
            if resp.status != 200:
                return None, None
            return data.get("url"), data.get("name")


async def start_bot(room_url):
    """Run the Pipecat bot in a background task (same process, errors visible in logs)."""
    os.environ["DAILY_ROOM_URL"] = room_url

    async def run_bot():
        try:
            import importlib.util
            import sys
            if "bot" in sys.modules:
                del sys.modules["bot"]
            bot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bot.py")
            spec = importlib.util.spec_from_file_location("bot", bot_path)
            bot_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(bot_module)
            await bot_module.main()
        except Exception as e:
            print(f"BOT ERROR: {e}", flush=True)
            import traceback
            traceback.print_exc()

    asyncio.ensure_future(run_bot())
    return os.getpid()


async def start_vision_bot(room_url):
    """Run the vision bot (Gemini multimodal live) in a background task."""
    os.environ["DAILY_ROOM_URL"] = room_url

    async def run_bot():
        try:
            import importlib.util
            import sys
            if "vision_bot" in sys.modules:
                del sys.modules["vision_bot"]
            bot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vision_bot.py")
            spec = importlib.util.spec_from_file_location("vision_bot", bot_path)
            bot_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(bot_module)
            await bot_module.main()
        except Exception as e:
            print(f"VISION BOT ERROR: {e}", flush=True)
            import traceback
            traceback.print_exc()

    asyncio.ensure_future(run_bot())
    return os.getpid()


@app.post("/start")
async def handle_start(request: Request):
    """POST /start — create room, spawn bot, return room URL to browser."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    lang = body.get("lang", "en")
    voice = body.get("voice", "")
    tts_provider = body.get("tts_provider", "azure")
    tts_voice = body.get("tts_voice", "")
    os.environ["VOICE_LANG"] = lang
    os.environ["VOICE_NAME"] = voice
    os.environ["TTS_PROVIDER"] = tts_provider
    os.environ["TTS_VOICE"] = tts_voice
    room_url, room_name = await create_daily_room()
    if not room_url:
        return JSONResponse({"error": "Failed to create Daily room"}, status_code=500)

    pid = await start_bot(room_url)
    return JSONResponse({"room_url": room_url, "room_name": room_name, "bot_pid": pid})


@app.post("/start-vision")
async def handle_start_vision(request: Request):
    """POST /start-vision — create room, spawn vision bot with camera support."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    room_url, room_name = await create_daily_room()
    if not room_url:
        return JSONResponse({"error": "Failed to create Daily room"}, status_code=500)

    pid = await start_vision_bot(room_url)
    return JSONResponse({"room_url": room_url, "room_name": room_name, "bot_pid": pid, "mode": "vision"})


@app.get("/health")
async def handle_health():
    return JSONResponse({"status": "ok"})


@app.get("/proxy")
async def handle_proxy(url: str = ""):
    """GET /proxy?url=https://... — fetch a page and serve it without iframe-blocking headers."""
    if not url:
        return PlainTextResponse("Missing url parameter", status_code=400)
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                body = await resp.read()
                raw_ct = resp.headers.get("Content-Type", "text/html")
                ct = raw_ct.split(";")[0].strip()
                return Response(
                    content=body,
                    media_type=ct,
                    headers={"Access-Control-Allow-Origin": "*"},
                )
    except Exception as e:
        return PlainTextResponse(f"Proxy error: {str(e)}", status_code=502)


@app.post("/dialout")
async def handle_dialout(request: Request):
    """POST /dialout — make an outbound phone call via Twilio."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    to_number = body.get("to", "")
    from_number = body.get("from", TWILIO_PHONE_NUMBER)
    lang = body.get("lang", "en")

    if not to_number:
        return JSONResponse({"error": "Missing 'to' phone number"}, status_code=400)
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return JSONResponse({"error": "Twilio credentials not configured"}, status_code=500)

    server_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
    if not server_url:
        server_url = request.headers.get("host", "localhost")

    # Set env vars so /ws handler can read them (Twilio strips query params from WebSocket)
    os.environ["VOICE_LANG"] = lang
    os.environ["VOICE_TO"] = to_number
    os.environ["VOICE_FROM"] = from_number
    os.environ["LLM_PROVIDER"] = "gemini"  # Gemini follows Cantonese instructions better than Cerebras/Qwen

    # Use inline TwiML with custom parameters
    inline_twiml = f"""<Response><Connect><Stream url="wss://{server_url}/ws"><Parameter name="lang" value="{lang}" /><Parameter name="to_number" value="{to_number}" /><Parameter name="from_number" value="{from_number}" /></Stream></Connect></Response>"""

    auth = base64.b64encode(f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode()).decode()

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Calls.json",
            headers={"Authorization": f"Basic {auth}"},
            data={
                "To": to_number,
                "From": from_number,
                "Twiml": inline_twiml,
            },
            timeout=aiohttp.ClientTimeout(total=15),
        ) as resp:
            result = await resp.json()
            logger.info(f"Twilio call response: {resp.status}")
            if resp.status in (200, 201):
                call_sid = result.get("sid", "")
                return JSONResponse({
                    "status": "calling",
                    "call_sid": call_sid,
                    "to": to_number,
                    "from": from_number,
                })
            else:
                return JSONResponse({"error": result}, status_code=500)


@app.api_route("/twiml", methods=["GET", "POST"])
async def handle_twiml(request: Request):
    """GET/POST /twiml — Twilio hits this when call connects, returns TwiML to stream audio to /ws."""
    to_number = request.query_params.get("to", "")
    from_number = request.query_params.get("from", "")
    lang = request.query_params.get("lang", "en")

    server_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", request.headers.get("host", "localhost"))

    from urllib.parse import quote
    encoded_to = quote(to_number, safe='')
    encoded_from = quote(from_number, safe='')
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="wss://{server_url}/ws?lang={lang}&amp;to={encoded_to}&amp;from={encoded_from}" />
    </Connect>
</Response>"""

    return Response(content=twiml, media_type="application/xml")


@app.websocket("/ws")
async def handle_ws(websocket: WebSocket):
    """WebSocket endpoint: Twilio connects directly, phone bot runs inline.

    Twilio strips URL query params from WebSocket connections.
    Custom params come via <Parameter> tags in the Twilio 'start' event.
    We use parse_twilio_start to extract them without corrupting the WebSocket.
    """
    logger.info(f">>> /ws WebSocket connection attempt from {websocket.client}")
    await websocket.accept()
    logger.info(">>> /ws WebSocket ACCEPTED")

    # Twilio sends params via the 'start' event customParameters.
    # We need to use Pipecat's built-in telephony parsing which handles this properly.
    # But since that may not be available in v0.0.108, we'll extract params
    # from the serializer after it processes the start event.
    #
    # Strategy: pass the websocket directly and let the serializer handle start.
    # Pass lang/to/from as env vars (set in dialout before call is made).
    lang = os.environ.get("VOICE_LANG", "en")
    to_number = os.environ.get("VOICE_TO", "")
    from_number = os.environ.get("VOICE_FROM", "")
    logger.info(f"Phone bot starting: lang={lang}, to={to_number}, from={from_number}")

    try:
        import importlib.util
        import sys
        if "phone_bot" in sys.modules:
            del sys.modules["phone_bot"]
        bot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phone_bot.py")
        spec = importlib.util.spec_from_file_location("phone_bot", bot_path)
        phone_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(phone_module)
        await phone_module.run_phone_bot_fastapi(
            websocket=websocket,
            stream_sid="",
            call_sid="",
            from_number=from_number,
            to_number=to_number,
            lang=lang,
        )
    except Exception as e:
        logger.error(f"Phone bot error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8765))
    print(f"Pipecat server starting on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
