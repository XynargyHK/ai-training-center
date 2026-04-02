"""
Tools registry.
- Pipecat-local: translate, switch_language (need TTS access)
- Brain-delegated: send_whatsapp (calls Brain /execute)
"""
from tools import translate, switch_language, send_whatsapp


def get_schemas():
    return [translate.schema, switch_language.schema, send_whatsapp.schema]


def register_all(llm, tts_service):
    translate.register(llm, tts_service)
    switch_language.register(llm, tts_service)
    send_whatsapp.register(llm)
