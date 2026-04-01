"""
Brain container configuration — all settings from environment variables.
"""
import os

# Gemini
GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# WhatsApp Gateway (self-hosted Baileys)
WHATSAPP_GATEWAY_URL = os.getenv("WHATSAPP_GATEWAY_URL", "https://vigilant-magic-production.up.railway.app")

# Server
PORT = int(os.getenv("PORT", "8000"))
