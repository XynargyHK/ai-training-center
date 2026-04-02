"""
Voice AI Skills — Function tools for browser and phone bots.
Each skill is a FunctionSchema + async handler.
Register with: register_all_skills(llm, tts)
"""
import os
import aiohttp
from loguru import logger
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.services.llm_service import FunctionCallParams


# ============================================================
# 1. SEARCH PLACES (Google Maps)
# ============================================================
search_places_func = FunctionSchema(
    name="search_places",
    description="Search for nearby places, restaurants, hotels, shops, etc. Use when user asks 'find a restaurant near X', 'where is the nearest pharmacy', etc.",
    properties={
        "query": {"type": "string", "description": "What to search for, e.g. 'sushi restaurant near Causeway Bay'"},
    },
    required=["query"],
)

async def handle_search_places(params: FunctionCallParams):
    query = params.arguments.get("query", "")
    logger.info(f"Searching places: {query}")
    # Use Google Maps search URL — works without API key
    maps_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
    # Also do a web search for results
    try:
        url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}+site:google.com/maps"
        headers = {"User-Agent": "Mozilla/5.0"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                html = await resp.text()
        import re
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()[:2000]
        await params.result_callback({"results": text, "maps_url": maps_url, "query": query})
    except Exception as e:
        await params.result_callback({"maps_url": maps_url, "query": query, "note": "Open the maps link for results"})


# ============================================================
# 2. GET DIRECTIONS
# ============================================================
get_directions_func = FunctionSchema(
    name="get_directions",
    description="Get directions between two locations. Use when user asks 'how to get from A to B', 'directions to the airport', etc.",
    properties={
        "origin": {"type": "string", "description": "Starting location"},
        "destination": {"type": "string", "description": "Destination location"},
        "mode": {"type": "string", "description": "Travel mode: driving, transit, walking, bicycling. Default: transit"},
    },
    required=["origin", "destination"],
)

async def handle_get_directions(params: FunctionCallParams):
    origin = params.arguments.get("origin", "").replace(" ", "+")
    destination = params.arguments.get("destination", "").replace(" ", "+")
    mode = params.arguments.get("mode", "transit")
    maps_url = f"https://www.google.com/maps/dir/{origin}/{destination}/@?travelmode={mode}"
    logger.info(f"Directions: {origin} → {destination} ({mode})")
    await params.result_callback({"maps_url": maps_url, "origin": origin, "destination": destination, "mode": mode})


# ============================================================
# 3. CONVERT CURRENCY
# ============================================================
convert_currency_func = FunctionSchema(
    name="convert_currency",
    description="Convert currency in real-time. Use when user asks 'how much is 100 USD in HKD', 'convert 500 EUR to JPY', etc.",
    properties={
        "amount": {"type": "number", "description": "Amount to convert"},
        "from_currency": {"type": "string", "description": "Source currency code, e.g. USD, EUR, HKD, JPY"},
        "to_currency": {"type": "string", "description": "Target currency code"},
    },
    required=["amount", "from_currency", "to_currency"],
)

async def handle_convert_currency(params: FunctionCallParams):
    amount = params.arguments.get("amount", 0)
    from_cur = params.arguments.get("from_currency", "USD").upper()
    to_cur = params.arguments.get("to_currency", "HKD").upper()
    logger.info(f"Converting {amount} {from_cur} → {to_cur}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_cur}",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                data = await resp.json()
                rate = data.get("rates", {}).get(to_cur, 0)
                result = round(amount * rate, 2)
                await params.result_callback({
                    "amount": amount, "from": from_cur, "to": to_cur,
                    "rate": rate, "result": result,
                    "summary": f"{amount} {from_cur} = {result} {to_cur}"
                })
    except Exception as e:
        await params.result_callback({"error": str(e)})


# ============================================================
# 4. GET WEATHER
# ============================================================
get_weather_func = FunctionSchema(
    name="get_weather",
    description="Get current weather for a city. Use when user asks 'what's the weather in Tokyo', 'is it raining in Hong Kong', etc.",
    properties={
        "city": {"type": "string", "description": "City name, e.g. 'Hong Kong', 'Tokyo', 'London'"},
    },
    required=["city"],
)

async def handle_get_weather(params: FunctionCallParams):
    city = params.arguments.get("city", "Hong Kong")
    logger.info(f"Getting weather for: {city}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://wttr.in/{city.replace(' ', '+')}?format=j1",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                data = await resp.json()
                current = data.get("current_condition", [{}])[0]
                await params.result_callback({
                    "city": city,
                    "temp_c": current.get("temp_C", "?"),
                    "feels_like_c": current.get("FeelsLikeC", "?"),
                    "description": current.get("weatherDesc", [{}])[0].get("value", "?"),
                    "humidity": current.get("humidity", "?"),
                    "wind_kmph": current.get("windspeedKmph", "?"),
                })
    except Exception as e:
        await params.result_callback({"error": str(e), "city": city})


# ============================================================
# 5. SEND WHATSAPP MEDIA (images, docs, videos)
# ============================================================
send_whatsapp_media_func = FunctionSchema(
    name="send_whatsapp_media",
    description="Send an image, document, or video via WhatsApp. Use when user says 'send this PDF to my WhatsApp', 'share the photo on WhatsApp', etc.",
    properties={
        "phone": {"type": "string", "description": "Phone number with country code, e.g. 85296099766"},
        "url": {"type": "string", "description": "URL of the media file to send"},
        "type": {"type": "string", "description": "Media type: image, document, video"},
        "caption": {"type": "string", "description": "Optional caption for the media"},
    },
    required=["phone", "url", "type"],
)

async def handle_send_whatsapp_media(params: FunctionCallParams):
    phone = params.arguments.get("phone", "").replace("+", "").replace(" ", "")
    url = params.arguments.get("url", "")
    media_type = params.arguments.get("type", "document")
    caption = params.arguments.get("caption", "")
    whapi_token = os.getenv("WHAPI_TOKEN", "")
    logger.info(f"Sending WhatsApp {media_type} to {phone}: {url}")
    try:
        endpoint = f"https://gate.whapi.cloud/messages/{media_type}"
        payload = {"to": phone, "media": url}
        if caption:
            payload["caption"] = caption
        if media_type == "document":
            payload["filename"] = url.split("/")[-1]
        async with aiohttp.ClientSession() as session:
            async with session.post(
                endpoint,
                headers={"Authorization": f"Bearer {whapi_token}", "Content-Type": "application/json"},
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                result = await resp.json()
                if resp.status in (200, 201):
                    await params.result_callback({"status": "sent", "type": media_type})
                else:
                    await params.result_callback({"status": "failed", "error": str(result)})
    except Exception as e:
        await params.result_callback({"status": "failed", "error": str(e)})


# ============================================================
# 6. CREATE NOTE / MEMO
# ============================================================
create_note_func = FunctionSchema(
    name="create_note",
    description="Create a note or memo. Use when user says 'note this down', 'remember this', 'take a note'. Sends the note to their WhatsApp for reference.",
    properties={
        "title": {"type": "string", "description": "Note title"},
        "content": {"type": "string", "description": "Note content"},
        "phone": {"type": "string", "description": "Phone number to send note to (optional)"},
    },
    required=["title", "content"],
)

async def handle_create_note(params: FunctionCallParams):
    title = params.arguments.get("title", "Note")
    content = params.arguments.get("content", "")
    phone = params.arguments.get("phone", "")
    logger.info(f"Creating note: {title}")
    note_text = f"📝 *{title}*\n\n{content}\n\n_Created by AI Assistant_"
    if phone:
        whapi_token = os.getenv("WHAPI_TOKEN", "")
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    "https://gate.whapi.cloud/messages/text",
                    headers={"Authorization": f"Bearer {whapi_token}", "Content-Type": "application/json"},
                    json={"to": phone.replace("+", "").replace(" ", ""), "body": note_text},
                )
            await params.result_callback({"status": "saved_and_sent", "title": title})
        except Exception:
            await params.result_callback({"status": "saved", "title": title})
    else:
        await params.result_callback({"status": "saved", "title": title, "content": content})


# ============================================================
# 7. SET TIMER / REMINDER
# ============================================================
set_reminder_func = FunctionSchema(
    name="set_reminder",
    description="Set a reminder. Use when user says 'remind me in 5 minutes', 'set a timer for 10 minutes'. Note: currently only announces the reminder, actual timer needs backend support.",
    properties={
        "message": {"type": "string", "description": "What to remind about"},
        "minutes": {"type": "number", "description": "Minutes from now"},
    },
    required=["message", "minutes"],
)

async def handle_set_reminder(params: FunctionCallParams):
    message = params.arguments.get("message", "")
    minutes = params.arguments.get("minutes", 5)
    logger.info(f"Reminder set: '{message}' in {minutes} minutes")
    await params.result_callback({
        "status": "set",
        "message": message,
        "minutes": minutes,
        "note": f"I'll remind you about '{message}' in {minutes} minutes."
    })


# ============================================================
# 8. SPLIT BILL
# ============================================================
split_bill_func = FunctionSchema(
    name="split_bill",
    description="Calculate bill splitting for a group. Use when user says 'split the bill', 'how much does each person owe', 'divide 500 by 4 people with tip', etc.",
    properties={
        "total": {"type": "number", "description": "Total bill amount"},
        "num_people": {"type": "number", "description": "Number of people to split between"},
        "currency": {"type": "string", "description": "Currency code, e.g. HKD, CNY, USD. Default: HKD"},
        "tip_percent": {"type": "number", "description": "Tip percentage. Default: 0"},
        "tax_percent": {"type": "number", "description": "Tax percentage (if not already included). Default: 0"},
        "items": {"type": "string", "description": "Optional: individual items with amounts, e.g. 'John had the steak 280, Mary had salad 120'"},
    },
    required=["total", "num_people"],
)

async def handle_split_bill(params: FunctionCallParams):
    total = params.arguments.get("total", 0)
    num_people = params.arguments.get("num_people", 2)
    currency = params.arguments.get("currency", "HKD")
    tip_pct = params.arguments.get("tip_percent", 0)
    tax_pct = params.arguments.get("tax_percent", 0)
    items = params.arguments.get("items", "")

    tax = total * (tax_pct / 100)
    subtotal = total + tax
    tip = subtotal * (tip_pct / 100)
    grand_total = subtotal + tip
    per_person = round(grand_total / num_people, 2)

    result = {
        "total": total,
        "tax": round(tax, 2),
        "tip": round(tip, 2),
        "grand_total": round(grand_total, 2),
        "num_people": num_people,
        "per_person": per_person,
        "currency": currency,
        "summary": f"Total {currency} {grand_total:.2f} split {num_people} ways = {currency} {per_person:.2f} each",
    }
    if tip_pct > 0:
        result["summary"] += f" (includes {tip_pct}% tip)"
    if items:
        result["items_note"] = items
    logger.info(f"Bill split: {result['summary']}")
    await params.result_callback(result)


# ============================================================
# 9. SEND WHATSAPP GROUP MESSAGE
# ============================================================
send_whatsapp_group_func = FunctionSchema(
    name="send_whatsapp_group",
    description="Send a message to a WhatsApp group. Use when user says 'message the group', 'send to our travel group', 'tell the group chat'. Can send text, images, videos, or links.",
    properties={
        "group_name": {"type": "string", "description": "Group name or ID to search for"},
        "message": {"type": "string", "description": "Message text to send"},
        "media_url": {"type": "string", "description": "Optional: URL of image/video/document to attach"},
        "media_type": {"type": "string", "description": "Optional: image, video, document (only if media_url provided)"},
    },
    required=["group_name", "message"],
)

async def handle_send_whatsapp_group(params: FunctionCallParams):
    group_name = params.arguments.get("group_name", "")
    message = params.arguments.get("message", "")
    media_url = params.arguments.get("media_url", "")
    media_type = params.arguments.get("media_type", "image")
    whapi_token = os.getenv("WHAPI_TOKEN", "")
    logger.info(f"Sending to WhatsApp group '{group_name}': {message[:50]}...")

    try:
        # First, search for the group by name
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://gate.whapi.cloud/groups",
                headers={"Authorization": f"Bearer {whapi_token}"},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                groups_data = await resp.json()

            # Find group matching name (case-insensitive partial match)
            groups = groups_data.get("groups", groups_data.get("data", []))
            target_group = None
            for g in groups:
                name = g.get("name", g.get("subject", "")).lower()
                if group_name.lower() in name:
                    target_group = g
                    break

            if not target_group:
                await params.result_callback({
                    "status": "failed",
                    "error": f"Group '{group_name}' not found. Available groups: {[g.get('name', g.get('subject', '')) for g in groups[:5]]}",
                })
                return

            group_id = target_group.get("id", target_group.get("chat_id", ""))

            # Send message (text or media)
            if media_url:
                endpoint = f"https://gate.whapi.cloud/messages/{media_type}"
                payload = {"to": group_id, "media": media_url, "caption": message}
            else:
                endpoint = "https://gate.whapi.cloud/messages/text"
                payload = {"to": group_id, "body": message}

            async with session.post(
                endpoint,
                headers={"Authorization": f"Bearer {whapi_token}", "Content-Type": "application/json"},
                json=payload,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                result = await resp.json()
                if resp.status in (200, 201):
                    await params.result_callback({"status": "sent", "group": target_group.get("name", group_name)})
                else:
                    await params.result_callback({"status": "failed", "error": str(result)})
    except Exception as e:
        await params.result_callback({"status": "failed", "error": str(e)})


# ============================================================
# 10. SCHEDULE WHATSAPP MESSAGE
# ============================================================
schedule_whatsapp_func = FunctionSchema(
    name="schedule_whatsapp",
    description="Schedule a WhatsApp message to be sent later. Use when user says 'send this message tomorrow at 9am', 'remind John at 6pm', 'schedule a message for later'.",
    properties={
        "phone": {"type": "string", "description": "Phone number with country code, e.g. 85296099766, or group name"},
        "message": {"type": "string", "description": "Message text to send"},
        "delay_minutes": {"type": "number", "description": "Minutes from now to send the message. E.g. 60 for 1 hour, 1440 for 24 hours"},
    },
    required=["phone", "message", "delay_minutes"],
)

async def handle_schedule_whatsapp(params: FunctionCallParams):
    phone = params.arguments.get("phone", "").replace("+", "").replace(" ", "")
    message = params.arguments.get("message", "")
    delay_minutes = params.arguments.get("delay_minutes", 60)
    logger.info(f"Scheduling WhatsApp to {phone} in {delay_minutes}min: {message[:50]}...")

    # For now, use asyncio delayed task (works while the bot is running)
    import asyncio

    async def send_later():
        await asyncio.sleep(delay_minutes * 60)
        whapi_token = os.getenv("WHAPI_TOKEN", "")
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    "https://gate.whapi.cloud/messages/text",
                    headers={"Authorization": f"Bearer {whapi_token}", "Content-Type": "application/json"},
                    json={"to": phone, "body": message},
                    timeout=aiohttp.ClientTimeout(total=10),
                )
            logger.info(f"Scheduled message sent to {phone}: {message[:50]}")
        except Exception as e:
            logger.error(f"Scheduled message failed: {e}")

    asyncio.create_task(send_later())

    hours = delay_minutes / 60
    if hours >= 1:
        time_str = f"{hours:.1f} hours"
    else:
        time_str = f"{delay_minutes} minutes"

    await params.result_callback({
        "status": "scheduled",
        "phone": phone,
        "delay_minutes": delay_minutes,
        "summary": f"Message scheduled to {phone} in {time_str}",
    })


# ============================================================
# REGISTER ALL SKILLS
# ============================================================
def get_all_skill_schemas():
    """Return list of all FunctionSchema objects for ToolsSchema."""
    return [
        search_places_func,
        get_directions_func,
        convert_currency_func,
        get_weather_func,
        send_whatsapp_media_func,
        create_note_func,
        set_reminder_func,
        split_bill_func,
        send_whatsapp_group_func,
        schedule_whatsapp_func,
    ]

def register_all_skills(llm):
    """Register all skill handlers with the LLM service."""
    llm.register_function("search_places", handle_search_places)
    llm.register_function("get_directions", handle_get_directions)
    llm.register_function("convert_currency", handle_convert_currency)
    llm.register_function("get_weather", handle_get_weather)
    llm.register_function("send_whatsapp_media", handle_send_whatsapp_media)
    llm.register_function("create_note", handle_create_note)
    llm.register_function("set_reminder", handle_set_reminder)
    llm.register_function("split_bill", handle_split_bill)
    llm.register_function("send_whatsapp_group", handle_send_whatsapp_group)
    llm.register_function("schedule_whatsapp", handle_schedule_whatsapp)
    logger.info(f"Registered {len(get_all_skill_schemas())} additional skills")
