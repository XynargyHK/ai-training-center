"""
Pipecat-local tools registry.
These tools live in Pipecat (not Brain) because they need direct TTS/transport access.
"""
from tools import translate, switch_language


def get_schemas():
    return [translate.schema, switch_language.schema]


def register_all(llm, tts_service):
    translate.register(llm, tts_service)
    switch_language.register(llm, tts_service)
