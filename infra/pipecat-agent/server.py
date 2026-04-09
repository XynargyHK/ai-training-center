"""
HTTP server for Voice AI (FastAPI + uvicorn):
- POST /start -> creates LiveKit room + generates token + spawns browser voice bot
- POST /start-vision -> creates LiveKit room + spawns vision bot
- POST /dialout -> creates LiveKit room + SIP participant for phone call
- GET /health, GET /proxy
- GET /ws -> legacy Twilio WebSocket (phone_bot.py fallback)
- POST /twiml -> legacy TwiML for Twilio WebSocket fallback

Transport: LiveKit (migrated from Daily)
"""
import os
import asyncio
import time
import json

import aiohttp
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse, Response, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from livekit.api import LiveKitAPI, AccessToken, VideoGrants

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://xynargyhk-ya1ihi9m.livekit.cloud")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
TWILIO_SIP_DOMAIN = os.getenv("TWILIO_SIP_DOMAIN", "")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def create_livekit_room(room_name=None):
    """Create a LiveKit room. Returns room name."""
    if not room_name:
        import uuid
        room_name = f"voice-{uuid.uuid4().hex[:8]}"

    try:
        async with LiveKitAPI(
            url=LIVEKIT_URL,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
        ) as api:
            from livekit.api import CreateRoomRequest
            room = await api.room.create_room(
                CreateRoomRequest(
                    name=room_name,
                    empty_timeout=300,  # 5 min empty timeout
                    max_participants=4,
                )
            )
            logger.info(f"LiveKit room created: {room.name}")
            return room.name
    except Exception as e:
        logger.error(f"Failed to create LiveKit room: {e}")
        return None


def create_livekit_token(room_name, identity, name=None, grants=None):
    """Create a LiveKit access token (JWT) for joining a room."""
    at = AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    at.with_identity(identity)
    at.with_name(name or identity)
    at.with_grants(grants or VideoGrants(
        room_join=True,
        room=room_name,
    ))
    from datetime import timedelta
    at.with_ttl(timedelta(hours=1))
    return at.to_jwt()


async def start_bot(room_name, token, lang="en", vision_enabled=False):
    """Run the Pipecat bot in a background task (same process)."""
    from bot import run_pipeline

    async def run_bot():
        try:
            await run_pipeline(
                room_name=room_name,
                token=token,
                lang=lang,
                mode="browser",
                vision_enabled=vision_enabled,
            )
        except Exception as e:
            logger.error(f"BOT ERROR: {e}")
            import traceback
            traceback.print_exc()

    asyncio.ensure_future(run_bot())
    return os.getpid()


async def start_vision_bot(room_name, token):
    """Run the vision bot (Gemini multimodal live) in a background task."""
    async def run_bot():
        try:
            import importlib.util
            import sys
            if "vision_bot" in sys.modules:
                del sys.modules["vision_bot"]
            bot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vision_bot.py")
            spec = importlib.util.spec_from_file_location("vision_bot", bot_path)
            bot_module = importlib.util.module_from_spec(spec)
            # Pass LiveKit config via env vars for vision_bot
            os.environ["LIVEKIT_ROOM_NAME"] = room_name
            os.environ["LIVEKIT_TOKEN"] = token
            spec.loader.exec_module(bot_module)
            await bot_module.main()
        except Exception as e:
            logger.error(f"VISION BOT ERROR: {e}")
            import traceback
            traceback.print_exc()

    asyncio.ensure_future(run_bot())
    return os.getpid()


async def start_phone_bot(room_name, token, lang, dialout_settings=None, greeting=None):
    """Run the unified pipeline in phone mode as a background task."""
    from bot import run_pipeline

    async def run_bot():
        try:
            await run_pipeline(
                room_name=room_name,
                token=token,
                lang=lang,
                mode="phone",
                dialout_settings=dialout_settings,
                vision_enabled=False,
                greeting=greeting,
            )
        except Exception as e:
            logger.error(f"PHONE BOT ERROR: {e}")
            import traceback
            traceback.print_exc()

    asyncio.ensure_future(run_bot())
    return os.getpid()


@app.post("/start")
async def handle_start(request: Request):
    """POST /start -- create LiveKit room, generate tokens, spawn bot, return connection info."""
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

    # 1. Create LiveKit room
    room_name = await create_livekit_room()
    if not room_name:
        return JSONResponse({"error": "Failed to create LiveKit room"}, status_code=500)

    # 2. Generate bot token (the bot joins the room)
    bot_token = create_livekit_token(room_name, identity="ai-assistant", name="AI Assistant")

    # 3. Generate user token (the browser client joins the room)
    user_token = create_livekit_token(room_name, identity="user", name="User")

    # 4. Spawn bot
    pid = await start_bot(room_name, bot_token, lang=lang)

    return JSONResponse({
        "room_name": room_name,
        "token": user_token,
        "livekit_url": LIVEKIT_URL,
        "bot_pid": pid,
    })


@app.post("/start-vision")
async def handle_start_vision(request: Request):
    """POST /start-vision -- create room, spawn vision bot with camera support."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    room_name = await create_livekit_room()
    if not room_name:
        return JSONResponse({"error": "Failed to create LiveKit room"}, status_code=500)

    bot_token = create_livekit_token(room_name, identity="ai-assistant", name="AI Assistant")
    user_token = create_livekit_token(room_name, identity="user", name="User")

    pid = await start_vision_bot(room_name, bot_token)

    return JSONResponse({
        "room_name": room_name,
        "token": user_token,
        "livekit_url": LIVEKIT_URL,
        "bot_pid": pid,
        "mode": "vision",
    })


@app.post("/dialout")
async def handle_dialout(request: Request):
    """POST /dialout -- make an outbound phone call via Twilio PSTN.

    Body: {to, from, lang}
    Flow: Twilio REST API dials number → /twiml returns <Stream> → /ws → phone_bot.py
    This is the proven path: clean 8kHz mulaw audio, no transcoding, no noise.
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    to_number = body.get("to", "")
    from_number = body.get("from", TWILIO_PHONE_NUMBER)
    lang = body.get("lang", "en")

    if not to_number:
        return JSONResponse({"error": "Missing 'to' phone number"}, status_code=400)

    # Set env vars for phone_bot.py (reads these on /ws connect)
    os.environ["VOICE_LANG"] = lang
    os.environ["VOICE_TO"] = to_number
    os.environ["VOICE_FROM"] = from_number

    # Use Twilio REST API to make outbound call → /twiml → /ws → phone_bot.py
    try:
        from twilio.rest import Client as TwilioClient
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        server_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", "pretty-alignment-production-891e.up.railway.app")
        from urllib.parse import quote
        twiml_url = f"https://{server_url}/twiml?lang={quote(lang)}&to={quote(to_number)}&from={quote(from_number)}"

        call = client.calls.create(
            to=to_number,
            from_=from_number,
            url=twiml_url,
        )
        logger.info(f"Twilio call created: {call.sid} to {to_number}")

        return JSONResponse({
            "status": "calling",
            "call_sid": call.sid,
            "to": to_number,
            "from": from_number,
            "lang": lang,
            "mode": "twilio_media_streams",
        })
    except Exception as e:
        logger.error(f"Twilio dialout failed: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/health")
async def handle_health():
    return JSONResponse({"status": "ok"})


@app.api_route("/twiml-sip", methods=["GET", "POST"])
async def handle_twiml_sip(request: Request):
    """Twilio SIP Domain Voice URL -- routes SIP call to actual phone number.

    When LiveKit/Daily dials sip:+85296099766@aistaffs-voice.sip.twilio.com,
    Twilio hits this endpoint. We return TwiML to dial the real number.
    """
    # Parse params from body or query string
    sip_to = ""
    sip_from = ""
    try:
        body = await request.body()
        body_str = body.decode("utf-8", errors="ignore")
        from urllib.parse import parse_qs, unquote
        params = parse_qs(body_str)
        sip_to = unquote(params.get("To", [""])[0])
        sip_from = unquote(params.get("From", [""])[0])
    except Exception:
        pass
    if not sip_to:
        sip_to = request.query_params.get("To", "")

    # Extract phone number from SIP URI: sip:+85296099766@... -> +85296099766
    import re
    match = re.search(r'sip:(\+?\d+)@', sip_to)
    phone_number = match.group(1) if match else sip_to

    logger.info(f"SIP->PSTN: routing {sip_to} -> {phone_number}, from={sip_from}")

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="{TWILIO_PHONE_NUMBER or '+14782888766'}">
        <Number>{phone_number}</Number>
    </Dial>
</Response>"""

    return Response(content=twiml, media_type="application/xml")


@app.get("/proxy")
async def handle_proxy(url: str = ""):
    """GET /proxy?url=https://... -- fetch a page and serve it without iframe-blocking headers."""
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


# ============================================================
# Legacy Twilio WebSocket endpoints (phone_bot.py fallback)
# ============================================================

@app.api_route("/twiml", methods=["GET", "POST"])
async def handle_twiml(request: Request):
    """GET/POST /twiml -- Twilio hits this when call connects, returns TwiML to stream audio to /ws."""
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
    """WebSocket endpoint: legacy Twilio phone_bot.py fallback.

    Twilio strips URL query params from WebSocket connections.
    Custom params come via <Parameter> tags in the Twilio 'start' event.
    """
    logger.info(f">>> /ws WebSocket connection attempt from {websocket.client}")
    await websocket.accept()
    logger.info(">>> /ws WebSocket ACCEPTED")

    lang = os.environ.get("VOICE_LANG", "en")
    to_number = os.environ.get("VOICE_TO", "")
    from_number = os.environ.get("VOICE_FROM", "")
    logger.info(f"Phone bot starting (legacy): lang={lang}, to={to_number}, from={from_number}")

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
