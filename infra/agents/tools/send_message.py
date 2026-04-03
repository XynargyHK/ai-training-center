"""
SEND MESSAGE tool — sends a message to any channel.
Channel-agnostic: WhatsApp, SMS, Telegram, WeChat, email.
Routes to the appropriate gateway adapter.

Input: to, message, channels (list)
Output: delivery status per channel
"""
import os
import aiohttp
from loguru import logger

# Gateway endpoints — add new channels here
GATEWAYS = {
    "whatsapp": {
        "url": os.getenv("WHATSAPP_GATEWAY_URL", "https://vigilant-magic-production.up.railway.app"),
        "endpoint": "/messages/text",
        "format": lambda to, msg: {"to": to.replace("+", "").replace(" ", ""), "body": msg},
    },
    "email": {
        "url": "https://api.resend.com",
        "endpoint": "/emails",
        "key_env": "RESEND_API_KEY",
        "format": lambda to, msg: {
            "from": os.getenv("CALENDAR_FROM_EMAIL", "sarah@aistaffs.app"),
            "to": [to], "subject": msg[:50], "text": msg,
        },
    },
    # Future: add telegram, wechat, sms, line here
    # "telegram": { "url": "https://api.telegram.org/bot{token}", ... },
    # "wechat": { "url": "https://api.weixin.qq.com/cgi-bin", ... },
    # "sms": { "url": "https://api.twilio.com", ... },
}


async def execute(to: str, message: str, channels: list = ["whatsapp"],
                  media_url: str = "", media_type: str = "image") -> dict:
    """Send a message to one or more channels.

    Args:
        to: Recipient (phone number, email, username)
        message: Message text
        channels: List of channels to deliver to
        media_url: Optional media attachment URL
        media_type: Type of media (image, video, document)

    Returns:
        dict with delivery status per channel
    """
    results = {}

    for channel in channels:
        gateway = GATEWAYS.get(channel)
        if not gateway:
            results[channel] = {"status": "failed", "error": f"Unknown channel: {channel}"}
            continue

        try:
            url = gateway["url"] + gateway["endpoint"]
            payload = gateway["format"](to, message)

            # Add media if provided
            if media_url and channel == "whatsapp":
                url = gateway["url"] + f"/messages/{media_type}"
                payload = {"to": to.replace("+", "").replace(" ", ""), "media": media_url, "caption": message}

            headers = {"Content-Type": "application/json"}

            # Channel-specific auth
            if channel == "email":
                key = os.getenv(gateway.get("key_env", ""), "")
                headers["Authorization"] = f"Bearer {key}"

            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers,
                                       timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    if resp.status in (200, 201):
                        results[channel] = {"status": "sent"}
                        logger.info(f"Message sent via {channel} to {to}")
                    else:
                        error = await resp.text()
                        results[channel] = {"status": "failed", "error": error[:200]}
                        logger.error(f"Message failed via {channel}: {error[:100]}")
        except Exception as e:
            results[channel] = {"status": "failed", "error": str(e)}
            logger.error(f"Message error via {channel}: {e}")

    return {
        "to": to,
        "channels": results,
        "all_sent": all(r.get("status") == "sent" for r in results.values()),
    }
