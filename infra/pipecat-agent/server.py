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

    twiml_url = f"https://{server_url}/twiml?to={to_number}&from={from_number}&lang={lang}"

    auth = base64.b64encode(f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode()).decode()

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Calls.json",
            headers={"Authorization": f"Basic {auth}"},
            data={
                "To": to_number,
                "From": from_number,
                "Url": twiml_url,
            },
            timeout=aiohttp.ClientTimeout(total=15),
        ) as resp:
            result = await resp.json()
            print(f"Twilio call response: {resp.status} {result}")
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

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="wss://{server_url}/ws">
            <Parameter name="to_number" value="{to_number}" />
            <Parameter name="from_number" value="{from_number}" />
            <Parameter name="lang" value="{lang}" />
        </Stream>
    </Connect>
</Response>"""

    return Response(content=twiml, media_type="application/xml")


@app.websocket("/ws")
async def handle_ws(websocket: WebSocket):
    """WebSocket endpoint: Twilio connects directly, phone bot runs inline via FastAPIWebsocketTransport."""
    await websocket.accept()

    # Read initial Twilio messages to extract stream_sid and custom parameters
    stream_sid = ""
    call_sid = ""
    from_number = ""
    to_number = ""
    lang = "en"

    # Twilio sends "connected" then "start" events before media
    # We need to peek at them to extract metadata, but the transport
    # will also process them via the serializer.
    # Strategy: read messages until we get "start", extract params,
    # then hand the websocket to the phone bot (which re-reads via transport).
    #
    # However, FastAPIWebsocketTransport reads from the websocket directly,
    # so we can't consume messages here. Instead, we'll parse custom params
    # from the first few messages using a wrapper approach.
    #
    # Better approach: Use a message-buffering wrapper that lets us peek
    # at messages before the transport consumes them.

    # We'll read the initial messages ourselves, then use a patched websocket
    # that replays them before reading new ones.
    buffered_messages = []

    try:
        # Read until we get the "start" event (usually 2 messages: connected + start)
        for _ in range(10):  # Safety limit
            message = await asyncio.wait_for(websocket.receive(), timeout=10.0)
            if message["type"] == "websocket.disconnect":
                logger.warning("Twilio disconnected before start event")
                return

            text = message.get("text", "")
            if text:
                buffered_messages.append(text)
                try:
                    data = json.loads(text)
                    event = data.get("event", "")

                    if event == "start":
                        start_data = data.get("start", {})
                        stream_sid = start_data.get("streamSid", data.get("streamSid", ""))
                        call_sid = start_data.get("callSid", data.get("callSid", ""))
                        custom = start_data.get("customParameters", {})
                        from_number = custom.get("from_number", "")
                        to_number = custom.get("to_number", "")
                        lang = custom.get("lang", "en")
                        logger.info(f"Twilio stream started: streamSid={stream_sid}, callSid={call_sid}, lang={lang}, to={to_number}")
                        break
                except (json.JSONDecodeError, KeyError):
                    pass
    except asyncio.TimeoutError:
        logger.error("Timeout waiting for Twilio start event")
        await websocket.close()
        return

    # Create a replay websocket wrapper that feeds buffered messages first
    replay_ws = _ReplayWebSocket(websocket, buffered_messages)

    # Run the phone bot pipeline directly with FastAPIWebsocketTransport
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
            websocket=replay_ws,
            stream_sid=stream_sid,
            call_sid=call_sid,
            from_number=from_number,
            to_number=to_number,
            lang=lang,
        )
    except Exception as e:
        logger.error(f"Phone bot error: {e}")
        import traceback
        traceback.print_exc()


class _ReplayWebSocket:
    """Wraps a FastAPI WebSocket to replay buffered messages before live ones.

    FastAPIWebsocketTransport calls websocket.receive() internally.
    This wrapper returns buffered messages first (the connected + start events
    we already consumed), then delegates to the real websocket.
    """

    def __init__(self, websocket: WebSocket, buffered_messages: list[str]):
        self._websocket = websocket
        self._buffered = list(buffered_messages)
        # Copy all attributes from the real websocket so Pipecat's checks work
        self.client_state = websocket.client_state
        self.application_state = websocket.application_state
        self.client = websocket.client
        self.headers = websocket.headers
        self.query_params = websocket.query_params
        self.path_params = websocket.path_params
        self.scope = websocket.scope

    async def receive(self):
        if self._buffered:
            text = self._buffered.pop(0)
            return {"type": "websocket.receive", "text": text}
        return await self._websocket.receive()

    async def send(self, message):
        await self._websocket.send(message)

    async def send_bytes(self, data: bytes):
        await self._websocket.send_bytes(data)

    async def send_text(self, data: str):
        await self._websocket.send_text(data)

    async def close(self, code: int = 1000, reason: str | None = None):
        await self._websocket.close(code=code, reason=reason)

    async def accept(self, subprotocol: str | None = None):
        await self._websocket.accept(subprotocol=subprotocol)

    def __getattr__(self, name):
        # Delegate any other attribute access to the real websocket
        return getattr(self._websocket, name)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8765))
    print(f"Pipecat server starting on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
