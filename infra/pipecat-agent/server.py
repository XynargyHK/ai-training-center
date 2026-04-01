"""
HTTP server for Voice AI:
- POST /start → creates Daily room + spawns browser voice bot
- POST /dialout → makes outbound phone call via Twilio + spawns phone bot
- POST /twiml → returns TwiML XML for Twilio to connect WebSocket
- GET /health, GET /proxy
"""
import os
import subprocess
import asyncio
import time

import aiohttp
from aiohttp import web
from loguru import logger

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_API_URL = "https://api.daily.co/v1"


async def create_daily_room():
    """Create a temporary Daily room for the voice session."""
    headers = {"Authorization": f"Bearer {DAILY_API_KEY}", "Content-Type": "application/json"}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{DAILY_API_URL}/rooms",
            headers=headers,
            json={
                "properties": {
                    "exp": int(time.time()) + 3600,  # 1 hour from now (Unix timestamp)
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
            # Force fresh import each time (different lang per call)
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


async def handle_start(request):
    """POST /start — create room, spawn bot, return room URL to browser."""
    try:
        body = await request.json()
    except:
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
        return web.json_response({"error": "Failed to create Daily room"}, status=500)

    pid = await start_bot(room_url)
    return web.json_response({"room_url": room_url, "room_name": room_name, "bot_pid": pid})


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


async def handle_start_vision(request):
    """POST /start-vision — create room, spawn vision bot with camera support."""
    try:
        body = await request.json()
    except:
        body = {}

    room_url, room_name = await create_daily_room()
    if not room_url:
        return web.json_response({"error": "Failed to create Daily room"}, status=500)

    pid = await start_vision_bot(room_url)
    return web.json_response({"room_url": room_url, "room_name": room_name, "bot_pid": pid, "mode": "vision"})


async def handle_health(request):
    return web.json_response({"status": "ok"})


async def handle_proxy(request):
    """GET /proxy?url=https://... — fetch a page and serve it without iframe-blocking headers."""
    url = request.query.get("url", "")
    if not url:
        return web.Response(text="Missing url parameter", status=400)
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                body = await resp.read()
                raw_ct = resp.headers.get("Content-Type", "text/html")
                ct = raw_ct.split(";")[0].strip()
                return web.Response(
                    body=body,
                    content_type=ct,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                    },
                )
    except Exception as e:
        return web.Response(text=f"Proxy error: {str(e)}", status=502)


TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

# Track active phone bot ports
_next_phone_port = 8770


async def handle_dialout(request):
    """POST /dialout — make an outbound phone call via Twilio."""
    global _next_phone_port
    try:
        body = await request.json()
    except:
        body = {}

    to_number = body.get("to", "")
    from_number = body.get("from", TWILIO_PHONE_NUMBER)
    lang = body.get("lang", "en")

    if not to_number:
        return web.json_response({"error": "Missing 'to' phone number"}, status=400)
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return web.json_response({"error": "Twilio credentials not configured"}, status=500)

    # Assign a port for this phone bot's WebSocket
    phone_port = _next_phone_port
    _next_phone_port += 1
    if _next_phone_port > 8799:
        _next_phone_port = 8770

    # Get the public URL for this server (Railway provides it)
    server_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
    if not server_url:
        # Fallback: construct from request
        server_url = request.host

    # Create outbound call via Twilio REST API
    import base64
    auth = base64.b64encode(f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode()).decode()

    twiml_url = f"https://{server_url}/twiml?port={phone_port}&to={to_number}&from={from_number}"

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

                # Spawn phone bot in background
                os.environ["VOICE_LANG"] = lang
                asyncio.ensure_future(_run_phone_bot(
                    phone_port=phone_port,
                    call_sid=call_sid,
                    from_number=from_number,
                    to_number=to_number,
                ))

                return web.json_response({
                    "status": "calling",
                    "call_sid": call_sid,
                    "to": to_number,
                    "from": from_number,
                })
            else:
                return web.json_response({"error": result}, status=500)


async def handle_twiml(request):
    """POST /twiml — Twilio hits this when call connects, returns TwiML to stream audio."""
    phone_port = request.query.get("port", "8770")
    to_number = request.query.get("to", "")
    from_number = request.query.get("from", "")

    server_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", request.host)

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="wss://{server_url}/ws-phone">
            <Parameter name="phone_port" value="{phone_port}" />
            <Parameter name="to_number" value="{to_number}" />
            <Parameter name="from_number" value="{from_number}" />
        </Stream>
    </Connect>
</Response>"""

    return web.Response(text=twiml, content_type="application/xml")


async def _run_phone_bot(phone_port, call_sid, from_number, to_number):
    """Run the phone bot pipeline."""
    try:
        import importlib.util
        import sys
        if "phone_bot" in sys.modules:
            del sys.modules["phone_bot"]
        bot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phone_bot.py")
        spec = importlib.util.spec_from_file_location("phone_bot", bot_path)
        phone_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(phone_module)
        await phone_module.run_phone_bot(
            websocket_server_host="0.0.0.0",
            websocket_server_port=phone_port,
            stream_sid="",  # Will be set when Twilio connects
            call_sid=call_sid,
            from_number=from_number,
            to_number=to_number,
        )
    except Exception as e:
        print(f"PHONE BOT ERROR: {e}", flush=True)
        import traceback
        traceback.print_exc()


async def handle_ws_phone(request):
    """WebSocket proxy: Twilio connects here (port 8765), we forward to internal phone bot (port 877x)."""
    import aiohttp as aiohttp_client

    ws_external = web.WebSocketResponse()
    await ws_external.prepare(request)

    # First message from Twilio is "connected", second is "start" with streamSid
    # We need to read the start message to get the phone_port from custom parameters
    phone_port = None
    buffered = []

    async for msg in ws_external:
        if msg.type == aiohttp_client.WSMsgType.TEXT:
            import json
            data = json.loads(msg.data)

            if data.get("event") == "start":
                # Extract custom parameters and stream_sid
                custom = data.get("start", {}).get("customParameters", {})
                phone_port = int(custom.get("phone_port", 8770))
                stream_sid = data.get("start", {}).get("streamSid", data.get("streamSid", ""))
                logger.info(f"Twilio stream started, streamSid={stream_sid}, proxying to port {phone_port}")

                # Pass stream_sid to internal bot via query parameter
                try:
                    async with aiohttp_client.ClientSession() as session:
                        async with session.ws_connect(f"ws://localhost:{phone_port}/ws?stream_sid={stream_sid}") as ws_internal:
                            # Forward the buffered messages
                            for buf_msg in buffered:
                                await ws_internal.send_str(buf_msg)
                            await ws_internal.send_str(msg.data)

                            # Bidirectional proxy with logging
                            ext_to_int_count = [0]
                            int_to_ext_count = [0]

                            async def forward_to_internal():
                                async for ext_msg in ws_external:
                                    if ext_msg.type == aiohttp_client.WSMsgType.TEXT:
                                        ext_to_int_count[0] += 1
                                        if ext_to_int_count[0] <= 3:
                                            print(f"[PROXY] Twilio→Bot msg #{ext_to_int_count[0]}: {ext_msg.data[:100]}", flush=True)
                                        await ws_internal.send_str(ext_msg.data)
                                    elif ext_msg.type in (aiohttp_client.WSMsgType.CLOSE, aiohttp_client.WSMsgType.CLOSING, aiohttp_client.WSMsgType.CLOSED):
                                        print(f"[PROXY] Twilio WS closed after {ext_to_int_count[0]} messages", flush=True)
                                        await ws_internal.close()
                                        break
                                    elif ext_msg.type == aiohttp_client.WSMsgType.ERROR:
                                        print(f"[PROXY] Twilio WS error: {ws_external.exception()}", flush=True)
                                        break

                            async def forward_to_external():
                                async for int_msg in ws_internal:
                                    if int_msg.type == aiohttp_client.WSMsgType.TEXT:
                                        int_to_ext_count[0] += 1
                                        if int_to_ext_count[0] <= 3:
                                            print(f"[PROXY] Bot→Twilio msg #{int_to_ext_count[0]}: {int_msg.data[:100]}", flush=True)
                                        await ws_external.send_str(int_msg.data)
                                    elif int_msg.type == aiohttp_client.WSMsgType.BINARY:
                                        int_to_ext_count[0] += 1
                                        if int_to_ext_count[0] <= 3:
                                            print(f"[PROXY] Bot→Twilio binary #{int_to_ext_count[0]}: {len(int_msg.data)} bytes", flush=True)
                                        await ws_external.send_bytes(int_msg.data)
                                    elif int_msg.type in (aiohttp_client.WSMsgType.CLOSE, aiohttp_client.WSMsgType.CLOSING, aiohttp_client.WSMsgType.CLOSED):
                                        print(f"[PROXY] Bot WS closed after sending {int_to_ext_count[0]} messages", flush=True)
                                        await ws_external.close()
                                        break

                            await asyncio.gather(
                                forward_to_internal(),
                                forward_to_external(),
                                return_exceptions=True,
                            )
                except Exception as e:
                    print(f"WS proxy error: {e}", flush=True)
                break
            else:
                # Buffer messages until we get the "start" event
                buffered.append(msg.data)
        elif msg.type == aiohttp_client.WSMsgType.ERROR:
            break

    return ws_external


app = web.Application()
app.router.add_post("/start", handle_start)
app.router.add_post("/start-vision", handle_start_vision)
app.router.add_post("/dialout", handle_dialout)
app.router.add_post("/twiml", handle_twiml)
app.router.add_get("/twiml", handle_twiml)
app.router.add_get("/ws-phone", handle_ws_phone)
app.router.add_get("/health", handle_health)
app.router.add_get("/proxy", handle_proxy)
# CORS for browser requests
for route in ["/start", "/start-vision", "/dialout"]:
    app.router.add_options(route, lambda r: web.Response(headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
    }))


@web.middleware
async def cors_middleware(request, handler):
    resp = await handler(request)
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

app.middlewares.append(cors_middleware)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8765))
    print(f"Pipecat server starting on port {port}")
    web.run_app(app, host="0.0.0.0", port=port)
