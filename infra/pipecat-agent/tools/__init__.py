"""
Tools registry — collects all tool schemas and registers handlers.
Pipecat-local tools: translate, switch_language (need TTS/transport access)
Brain tools: everything else (via HTTP proxy) — TODO after demo
"""
from tools import translate, switch_language


def get_pipecat_schemas():
    """Return FunctionSchema list for tools that run in Pipecat."""
    return [
        translate.schema,
        switch_language.schema,
    ]


def register_pipecat_tools(llm, tts_service, transport):
    """Register Pipecat-local tools with the LLM."""
    translate.register(llm, tts_service)
    switch_language.register(llm, transport)
