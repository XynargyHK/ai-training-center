"""
HTTP server for Voice AI (FastAPI + uvicorn):
- POST /start → creates Daily room + spawns browser voice bot
- POST /start-vision → creates Daily room + spawns vision bot
- POST /dialout → creates Daily room with SIP dialout + spawns phone bot via run_pipeline
- GET /health, GET /proxy
- GET /ws → legacy Twilio WebSocket (phone_bot.py fallback)
- POST /twiml → legacy TwiML for Twilio WebSocket fallback
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
TWILIO_SIP_DOMAIN = os.getenv("TWILIO_SIP_DOMAIN", "")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def create_daily_room(enable_dialout=False):
    """Create a temporary Daily room for the voice session."""
    headers = {"Authorization": f"Bearer {DAILY_API_KEY}", "Content-Type": "application/json"}
    properties = {
        "exp": int(time.time()) + 3600,
        "enable_chat": False,
        "enable_screenshare": False,
        "max_participants": 2,
    }
    if enable_dialout:
        properties["enable_dialout"] = True
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{DAILY_API_URL}/rooms",
            headers=headers,
            json={"properties": properties},
        ) as resp:
            data = await resp.json()
            print(f"Daily API response: {resp.status} {data}")
            if resp.status != 200:
                return None, None
            return data.get("url"), data.get("name")


async def create_daily_token(room_name, owner=False):
    """Create a Daily meeting token for the given room."""
    headers = {"Authorization": f"Bearer {DAILY_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "properties": {
            "room_name": room_name,
            "exp": int(time.time()) + 3600,
        }
    }
    if owner:
        payload["properties"]["is_owner"] = True
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{DAILY_API_URL}/meeting-tokens",
            headers=headers,
            json=payload,
        ) as resp:
            data = await resp.json()
            if resp.status != 200:
                logger.error(f"Failed to create token: {resp.status} {data}")
                return None
            return data.get("token")


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


async def start_phone_bot(room_url, token, lang, dialout_settings, greeting=None):
    """Run the unified pipeline in phone mode as a background task."""

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
            await bot_module.run_pipeline(
                room_url=room_url,
                token=token,
                lang=lang,
                mode="phone",
                dialout_settings=dialout_settings,
                vision_enabled=False,
                greeting=greeting,
            )
        except Exception as e:
            print(f"PHONE BOT ERROR: {e}", flush=True)
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


@app.post("/dialout")
async def handle_dialout(request: Request):
    """POST /dialout — make an outbound phone call via Daily SIP dialout.

    Body: {to, from, lang, greeting}
    Flow: create Daily room (dialout-enabled) -> get owner token -> launch run_pipeline(phone) -> Daily dials out via SIP
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    to_number = body.get("to", "")
    from_number = body.get("from", TWILIO_PHONE_NUMBER)
    lang = body.get("lang", "en")
    greeting = body.get("greeting", None)

    if not to_number:
        return JSONResponse({"error": "Missing 'to' phone number"}, status_code=400)

    # Set env vars for bot module (STT/TTS config reads these)
    os.environ["VOICE_LANG"] = lang

    # 1. Create Daily room with dialout enabled
    room_url, room_name = await create_daily_room(enable_dialout=True)
    if not room_url:
        return JSONResponse({"error": "Failed to create Daily room"}, status_code=500)

    # 2. Create owner meeting token (required for dialout)
    token = await create_daily_token(room_name, owner=True)
    if not token:
        return JSONResponse({"error": "Failed to create meeting token"}, status_code=500)

    # 3. Construct dialout settings
    # If TWILIO_SIP_DOMAIN is set, use SIP URI for Twilio routing
    # Otherwise, use the phone number directly (Daily PSTN dial-out for US numbers)
    clean_number = to_number.lstrip("+")
    if TWILIO_SIP_DOMAIN:
        sip_uri = f"sip:+{clean_number}@{TWILIO_SIP_DOMAIN}"
        dialout_settings = {
            "sipUri": sip_uri,
            "displayName": from_number or "AI Assistant",
        }
        logger.info(f"Dialout via SIP: {sip_uri}")
    else:
        # Direct PSTN dialout (Daily handles routing, US numbers only)
        dialout_settings = {
            "phoneNumber": f"+{clean_number}",
            "displayName": from_number or "AI Assistant",
        }
        logger.info(f"Dialout via PSTN: +{clean_number}")

    # 4. Launch run_pipeline in phone mode
    pid = await start_phone_bot(
        room_url=room_url,
        token=token,
        lang=lang,
        dialout_settings=dialout_settings,
        greeting=greeting,
    )

    return JSONResponse({
        "status": "calling",
        "room_url": room_url,
        "room_name": room_name,
        "to": to_number,
        "from": from_number,
        "lang": lang,
        "mode": "daily_sip" if TWILIO_SIP_DOMAIN else "daily_pstn",
        "bot_pid": pid,
    })


@app.get("/health")
async def handle_health():
    return JSONResponse({"status": "ok"})


@app.api_route("/twiml-sip", methods=["GET", "POST"])
async def handle_twiml_sip(request: Request):
    """Twilio SIP Domain Voice URL — routes SIP call to actual phone number.

    When Daily dials sip:+85296099766@aistaffs-voice.sip.twilio.com,
    Twilio hits this endpoint. We return TwiML to dial the real number.
    """
    # Parse params from body or query string (avoid form parsing which needs python-multipart)
    sip_to = ""
    sip_from = ""
    try:
        body = await request.body()
        body_str = body.decode("utf-8", errors="ignore")
        # Twilio sends URL-encoded form data: To=sip%3A...&From=sip%3A...
        from urllib.parse import parse_qs, unquote
        params = parse_qs(body_str)
        sip_to = unquote(params.get("To", [""])[0])
        sip_from = unquote(params.get("From", [""])[0])
    except Exception:
        pass
    if not sip_to:
        sip_to = request.query_params.get("To", "")

    # Extract phone number from SIP URI: sip:+85296099766@... → +85296099766
    import re
    match = re.search(r'sip:(\+?\d+)@', sip_to)
    phone_number = match.group(1) if match else sip_to

    logger.info(f"SIP→PSTN: routing {sip_to} → {phone_number}, from={sip_from}")

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="{TWILIO_PHONE_NUMBER or '+14782888766'}">
        <Number>{phone_number}</Number>
    </Dial>
</Response>"""

    return Response(content=twiml, media_type="application/xml")


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


# ============================================================
# Legacy Twilio WebSocket endpoints (phone_bot.py fallback)
# ============================================================

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
