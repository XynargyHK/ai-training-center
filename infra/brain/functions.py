"""
Brain function handlers — all 14 functions migrated from Pipecat bot.py + skills.py.
Each function is a standalone async function that returns a dict result.
Functions that need to trigger browser actions return client_actions list.
"""
import os
import re
import urllib.parse
import aiohttp
from loguru import logger
from config import WHATSAPP_GATEWAY_URL


# ============================================================
# 1. OPEN URL (browser action)
# ============================================================
async def open_url(url: str) -> dict:
    if not url.startswith(("http", "tel:", "mailto:", "geo:")):
        url = "https://" + url
    logger.info(f"Open URL: {url}")
    return {
        "status": "opened",
        "url": url,
        "client_actions": [{"type": "open-url", "url": url}],
    }


# ============================================================
# 2. SEARCH WEB (DuckDuckGo)
# ============================================================
async def search_web(query: str) -> dict:
    logger.info(f"Searching web: {query}")
    try:
        url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                html = await resp.text()
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()[:3000]
        return {"results": text, "query": query}
    except Exception as e:
        return {"error": str(e), "query": query}


# ============================================================
# 3. SEND WHATSAPP TEXT (via Baileys gateway)
# ============================================================
async def send_whatsapp(phone: str, message: str) -> dict:
    phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    logger.info(f"Sending WhatsApp to {phone}: {message[:50]}...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{WHATSAPP_GATEWAY_URL}/messages/text",
                headers={"Content-Type": "application/json"},
                json={"to": phone, "body": message},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                result = await resp.json()
                if resp.status in (200, 201):
                    return {"status": "sent", "phone": phone}
                else:
                    return {"status": "failed", "error": str(result)}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


# ============================================================
# 4. MAKE CALL (browser action)
# ============================================================
async def make_call(phone: str) -> dict:
    if not phone.startswith("+"):
        phone = "+" + phone
    url = f"tel:{phone}"
    logger.info(f"Making call: {url}")
    return {
        "status": "dialing",
        "phone": phone,
        "client_actions": [{"type": "open-url", "url": url}],
    }


# ============================================================
# 5. SEND EMAIL (browser action)
# ============================================================
async def send_email(to: str, subject: str = "", body: str = "") -> dict:
    url = f"mailto:{to}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}"
    logger.info(f"Send email to: {to}")
    return {
        "status": "opened",
        "to": to,
        "client_actions": [{"type": "open-url", "url": url}],
    }


# ============================================================
# 6. SWITCH LANGUAGE (browser action)
# ============================================================
LANGUAGE_CODES = {
    "english": "en", "mandarin": "zh", "cantonese": "yue",
    "japanese": "ja", "korean": "ko", "french": "fr",
    "spanish": "es", "german": "de", "vietnamese": "vi",
}

async def switch_language(language: str) -> dict:
    lang_code = LANGUAGE_CODES.get(language.lower(), "en")
    logger.info(f"Switching language to {language} ({lang_code})")
    return {
        "status": "restarting",
        "language": language,
        "instruction": f"The call is restarting with {language} language settings. Say a brief goodbye.",
        "client_actions": [{"type": "switch-language", "lang": lang_code}],
    }


# ============================================================
# 7. TRANSLATE MODE
# ============================================================
async def translate(target_language: str) -> dict:
    target = target_language.lower()
    logger.info(f"Translation mode: {target}")
    return {
        "status": "translating",
        "target_language": target,
        "instruction": f"TRANSLATION MODE ACTIVE. From now on, EVERY response must be in {target} ONLY. Translate everything the user says into {target}. Stay in this mode until user says 'stop translating'.",
    }


# ============================================================
# 8. SEARCH PLACES (Google Maps)
# ============================================================
async def search_places(query: str) -> dict:
    logger.info(f"Searching places: {query}")
    maps_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
    try:
        url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}+site:google.com/maps"
        headers = {"User-Agent": "Mozilla/5.0"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                html = await resp.text()
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()[:2000]
        return {"results": text, "maps_url": maps_url, "query": query}
    except Exception as e:
        return {"maps_url": maps_url, "query": query, "note": "Open the maps link for results"}


# ============================================================
# 9. GET DIRECTIONS
# ============================================================
async def get_directions(origin: str, destination: str, mode: str = "transit") -> dict:
    origin_enc = origin.replace(" ", "+")
    dest_enc = destination.replace(" ", "+")
    maps_url = f"https://www.google.com/maps/dir/{origin_enc}/{dest_enc}/@?travelmode={mode}"
    logger.info(f"Directions: {origin} -> {destination} ({mode})")
    return {"maps_url": maps_url, "origin": origin, "destination": destination, "mode": mode}


# ============================================================
# 10. CONVERT CURRENCY
# ============================================================
async def convert_currency(amount: float, from_currency: str, to_currency: str) -> dict:
    from_cur = from_currency.upper()
    to_cur = to_currency.upper()
    logger.info(f"Converting {amount} {from_cur} -> {to_cur}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_cur}",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                data = await resp.json()
                rate = data.get("rates", {}).get(to_cur, 0)
                result = round(amount * rate, 2)
                return {
                    "amount": amount, "from": from_cur, "to": to_cur,
                    "rate": rate, "result": result,
                    "summary": f"{amount} {from_cur} = {result} {to_cur}",
                }
    except Exception as e:
        return {"error": str(e)}


# ============================================================
# 11. GET WEATHER
# ============================================================
async def get_weather(city: str) -> dict:
    logger.info(f"Getting weather for: {city}")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://wttr.in/{city.replace(' ', '+')}?format=j1",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                data = await resp.json()
                current = data.get("current_condition", [{}])[0]
                return {
                    "city": city,
                    "temp_c": current.get("temp_C", "?"),
                    "feels_like_c": current.get("FeelsLikeC", "?"),
                    "description": current.get("weatherDesc", [{}])[0].get("value", "?"),
                    "humidity": current.get("humidity", "?"),
                    "wind_kmph": current.get("windspeedKmph", "?"),
                }
    except Exception as e:
        return {"error": str(e), "city": city}


# ============================================================
# 12. SEND WHATSAPP MEDIA (via Baileys gateway)
# ============================================================
async def send_whatsapp_media(phone: str, url: str, media_type: str = "document", caption: str = "") -> dict:
    phone = phone.replace("+", "").replace(" ", "")
    logger.info(f"Sending WhatsApp {media_type} to {phone}: {url}")
    try:
        endpoint = f"{WHATSAPP_GATEWAY_URL}/messages/{media_type}"
        payload = {"to": phone, "media": url}
        if caption:
            payload["caption"] = caption
        if media_type == "document":
            payload["filename"] = url.split("/")[-1]
        async with aiohttp.ClientSession() as session:
            async with session.post(
                endpoint,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                result = await resp.json()
                if resp.status in (200, 201):
                    return {"status": "sent", "type": media_type}
                else:
                    return {"status": "failed", "error": str(result)}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


# ============================================================
# 13. CREATE NOTE
# ============================================================
async def create_note(title: str, content: str, phone: str = "") -> dict:
    logger.info(f"Creating note: {title}")
    note_text = f"*{title}*\n\n{content}\n\n_Created by AI Assistant_"
    if phone:
        result = await send_whatsapp(phone, note_text)
        return {"status": "saved_and_sent", "title": title, "send_result": result}
    return {"status": "saved", "title": title, "content": content}


# ============================================================
# 14. SET REMINDER
# ============================================================
async def set_reminder(message: str, minutes: float = 5) -> dict:
    logger.info(f"Reminder set: '{message}' in {minutes} minutes")
    return {
        "status": "set",
        "message": message,
        "minutes": minutes,
        "note": f"I'll remind you about '{message}' in {minutes} minutes.",
    }


# ============================================================
# 15. REMEMBER FACT (store in Brain's soul)
# ============================================================
async def remember_fact(entity_type: str, entity_key: str, content: str) -> dict:
    """Store a permanent fact in the Brain's soul memory."""
    logger.info(f"Remembering: {entity_type}/{entity_key} = {content[:50]}")
    try:
        from memory import store_soul_fact
        result = await store_soul_fact(
            user_id="system",
            business_unit_id=None,
            entity_type=entity_type,
            entity_key=entity_key,
            content=content,
            source="brain_auto",
        )
        if "error" in result:
            return {"status": "failed", "error": result["error"]}
        return {"status": "remembered", "entity_key": entity_key}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


# ============================================================
# 16. RECALL FACTS (search Brain's soul)
# ============================================================
async def recall_facts(query: str) -> dict:
    """Search the Brain's soul memory for relevant facts."""
    logger.info(f"Recalling: {query}")
    try:
        from memory import get_soul_facts
        facts = await get_soul_facts(user_id="system", business_unit_id=None, limit=50)
        # Search across entity_key, entity_type, and content
        query_words = query.lower().split()
        relevant = []
        for f in facts:
            searchable = f"{f.get('content', '')} {f.get('entity_key', '')} {f.get('entity_type', '')}".lower()
            if any(word in searchable for word in query_words):
                relevant.append(f)
        return {"facts": [{"key": f["entity_key"], "content": f["content"]} for f in relevant[:5]], "count": len(relevant)}
    except Exception as e:
        return {"facts": [], "error": str(e)}


# ============================================================
# 17. SEND WHATSAPP GROUP (via Baileys gateway)
# ============================================================
async def send_whatsapp_group(group_name: str, message: str, media_url: str = "", media_type: str = "image") -> dict:
    """Send a message to a WhatsApp group by searching for the group name."""
    logger.info(f"Sending to WhatsApp group '{group_name}': {message[:50]}...")
    try:
        # Search for group by name via gateway
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{WHATSAPP_GATEWAY_URL}/groups",
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                groups_data = await resp.json()

            groups = groups_data.get("groups", groups_data.get("data", []))
            target_group = None
            for g in groups:
                name = g.get("name", g.get("subject", "")).lower()
                if group_name.lower() in name:
                    target_group = g
                    break

            if not target_group:
                return {
                    "status": "failed",
                    "error": f"Group '{group_name}' not found. Available: {[g.get('name', g.get('subject', '')) for g in groups[:5]]}",
                }

            group_id = target_group.get("id", target_group.get("chat_id", ""))

            if media_url:
                endpoint = f"{WHATSAPP_GATEWAY_URL}/messages/{media_type}"
                payload = {"to": group_id, "media": media_url, "caption": message}
            else:
                endpoint = f"{WHATSAPP_GATEWAY_URL}/messages/text"
                payload = {"to": group_id, "body": message}

            async with session.post(
                endpoint,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                result = await resp.json()
                if resp.status in (200, 201):
                    return {"status": "sent", "group": target_group.get("name", group_name)}
                else:
                    return {"status": "failed", "error": str(result)}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


# ============================================================
# 18. SCHEDULE WHATSAPP MESSAGE
# ============================================================
async def schedule_whatsapp(phone: str, message: str, delay_minutes: float = 60) -> dict:
    """Schedule a WhatsApp message to be sent later."""
    import asyncio
    logger.info(f"Scheduling WhatsApp to {phone} in {delay_minutes}min: {message[:50]}...")

    async def send_later():
        await asyncio.sleep(delay_minutes * 60)
        try:
            await send_whatsapp(phone, message)
            logger.info(f"Scheduled message sent to {phone}")
        except Exception as e:
            logger.error(f"Scheduled message failed: {e}")

    asyncio.create_task(send_later())

    hours = delay_minutes / 60
    time_str = f"{hours:.1f} hours" if hours >= 1 else f"{int(delay_minutes)} minutes"
    return {
        "status": "scheduled",
        "phone": phone,
        "delay_minutes": delay_minutes,
        "summary": f"Message scheduled to {phone} in {time_str}",
    }


# ============================================================
# 19. SPLIT BILL
# ============================================================
async def split_bill(total: float, num_people: int, currency: str = "HKD", tip_percent: float = 0, tax_percent: float = 0) -> dict:
    """Calculate bill splitting for a group."""
    tax = total * (tax_percent / 100)
    subtotal = total + tax
    tip = subtotal * (tip_percent / 100)
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
    if tip_percent > 0:
        result["summary"] += f" (includes {tip_percent}% tip)"
    logger.info(f"Bill split: {result['summary']}")
    return result


# ============================================================
# FUNCTION REGISTRY — maps function names to handlers
# ============================================================
FUNCTION_REGISTRY = {
    "open_url": open_url,
    "search_web": search_web,
    "send_whatsapp": send_whatsapp,
    "make_call": make_call,
    "send_email": send_email,
    "switch_language": switch_language,
    "translate": translate,
    "search_places": search_places,
    "get_directions": get_directions,
    "convert_currency": convert_currency,
    "get_weather": get_weather,
    "send_whatsapp_media": send_whatsapp_media,
    "create_note": create_note,
    "set_reminder": set_reminder,
    "remember_fact": remember_fact,
    "recall_facts": recall_facts,
    "send_whatsapp_group": send_whatsapp_group,
    "schedule_whatsapp": schedule_whatsapp,
    "split_bill": split_bill,
    "list_calendar_events": None,  # placeholder, registered below
    "create_calendar_event": None,
    "check_calendar_availability": None,
}

# Calendar tools
from calendar_tool import list_events, create_event, check_availability
FUNCTION_REGISTRY["list_calendar_events"] = list_events
FUNCTION_REGISTRY["create_calendar_event"] = create_event
FUNCTION_REGISTRY["check_calendar_availability"] = check_availability

# Add advanced tools (OpenClaw-inspired)
from tools_advanced import ADVANCED_FUNCTION_REGISTRY, ADVANCED_TOOL_DECLARATIONS
FUNCTION_REGISTRY.update(ADVANCED_FUNCTION_REGISTRY)


# ============================================================
# TOOL DECLARATIONS — for Gemini function calling
# ============================================================
TOOL_DECLARATIONS = [
    {
        "name": "open_url",
        "description": "Open a URL on the user's device. Use for websites, phone calls (tel:), WhatsApp (wa.me), email (mailto:), or maps.",
        "parameters": {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"]},
    },
    {
        "name": "search_web",
        "description": "Search the web for current info like prices, news, weather, facts.",
        "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
    },
    {
        "name": "send_whatsapp",
        "description": "Send a WhatsApp text message.",
        "parameters": {"type": "object", "properties": {"phone": {"type": "string"}, "message": {"type": "string"}}, "required": ["phone", "message"]},
    },
    {
        "name": "make_call",
        "description": "Initiate a phone call.",
        "parameters": {"type": "object", "properties": {"phone": {"type": "string"}}, "required": ["phone"]},
    },
    {
        "name": "send_email",
        "description": "Open email compose.",
        "parameters": {"type": "object", "properties": {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}}, "required": ["to"]},
    },
    {
        "name": "switch_language",
        "description": "Switch the AI's speaking language.",
        "parameters": {"type": "object", "properties": {"language": {"type": "string"}}, "required": ["language"]},
    },
    {
        "name": "translate",
        "description": "Start real-time translation mode.",
        "parameters": {"type": "object", "properties": {"target_language": {"type": "string"}}, "required": ["target_language"]},
    },
    {
        "name": "search_places",
        "description": "Search for nearby places, restaurants, hotels, shops.",
        "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
    },
    {
        "name": "get_directions",
        "description": "Get directions between two locations.",
        "parameters": {"type": "object", "properties": {"origin": {"type": "string"}, "destination": {"type": "string"}, "mode": {"type": "string"}}, "required": ["origin", "destination"]},
    },
    {
        "name": "convert_currency",
        "description": "Convert currency in real-time.",
        "parameters": {"type": "object", "properties": {"amount": {"type": "number"}, "from_currency": {"type": "string"}, "to_currency": {"type": "string"}}, "required": ["amount", "from_currency", "to_currency"]},
    },
    {
        "name": "get_weather",
        "description": "Get current weather for a city.",
        "parameters": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]},
    },
    {
        "name": "send_whatsapp_media",
        "description": "Send image, document, or video via WhatsApp.",
        "parameters": {"type": "object", "properties": {"phone": {"type": "string"}, "url": {"type": "string"}, "media_type": {"type": "string"}, "caption": {"type": "string"}}, "required": ["phone", "url", "media_type"]},
    },
    {
        "name": "create_note",
        "description": "Create a note/memo, optionally send via WhatsApp.",
        "parameters": {"type": "object", "properties": {"title": {"type": "string"}, "content": {"type": "string"}, "phone": {"type": "string"}}, "required": ["title", "content"]},
    },
    {
        "name": "set_reminder",
        "description": "Set a reminder for the user.",
        "parameters": {"type": "object", "properties": {"message": {"type": "string"}, "minutes": {"type": "number"}}, "required": ["message", "minutes"]},
    },
    {
        "name": "remember_fact",
        "description": "Store a permanent fact about the user or a contact. Use when the user says 'remember this', 'note that I...', or shares important personal info like allergies, preferences, birthdays.",
        "parameters": {"type": "object", "properties": {"entity_type": {"type": "string", "description": "Type: person, preference, fact, product, dispute"}, "entity_key": {"type": "string", "description": "Unique key, e.g. 'shellfish_allergy' or 'birthday'"}, "content": {"type": "string", "description": "The fact to remember"}}, "required": ["entity_type", "entity_key", "content"]},
    },
    {
        "name": "recall_facts",
        "description": "Search stored facts and memories. Use when user asks 'do you remember...', 'what did I tell you about...', or needs info from a previous conversation.",
        "parameters": {"type": "object", "properties": {"query": {"type": "string", "description": "What to search for"}}, "required": ["query"]},
    },
] + ADVANCED_TOOL_DECLARATIONS
