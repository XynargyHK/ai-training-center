"""
HTTP server that creates a Daily room and spawns the Pipecat bot.
Browser calls POST /start → gets room URL → joins via Daily JS SDK.
"""
import os
import subprocess
import asyncio
import time

import aiohttp
from aiohttp import web

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
    os.environ["VOICE_LANG"] = lang
    room_url, room_name = await create_daily_room()
    if not room_url:
        return web.json_response({"error": "Failed to create Daily room"}, status=500)

    pid = await start_bot(room_url)
    return web.json_response({"room_url": room_url, "room_name": room_name, "bot_pid": pid})


async def handle_health(request):
    return web.json_response({"status": "ok"})


app = web.Application()
app.router.add_post("/start", handle_start)
app.router.add_get("/health", handle_health)
# CORS for browser requests
app.router.add_options("/start", lambda r: web.Response(headers={
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
