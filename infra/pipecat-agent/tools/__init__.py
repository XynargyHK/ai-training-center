"""
Tools registry — all tools as modular bricks.
Pipecat-local: need TTS or transport access
Brain-delegated: pure data/actions via Brain /execute
"""
from tools import (
    translate, switch_language, vision,
    open_url, search_web, make_call, send_email,
    search_places, get_directions,
    send_whatsapp, send_whatsapp_group, schedule_whatsapp, split_bill,
    calendar,
)


def get_schemas(include_vision=False):
    schemas = [
        open_url.schema,
        search_web.schema,
        search_places.schema,
        get_directions.schema,
        make_call.schema,
        send_email.schema,
        translate.schema,
        switch_language.schema,
        send_whatsapp.schema,
        send_whatsapp_group.schema,
        schedule_whatsapp.schema,
        split_bill.schema,
    ] + calendar.schemas
    if include_vision:
        schemas.append(vision.schema)
    return schemas


def register_all(llm, tts_service, transport=None, participant_id_ref=None):
    # Pipecat-local (need TTS or transport)
    translate.register(llm, tts_service)
    switch_language.register(llm, tts_service)
    if transport:
        open_url.register(llm, transport)
        make_call.register(llm, transport)
        send_email.register(llm, transport)
        search_places.register(llm, transport)
        get_directions.register(llm, transport)
    # Brain-delegated
    search_web.register(llm)
    send_whatsapp.register(llm)
    send_whatsapp_group.register(llm)
    schedule_whatsapp.register(llm)
    split_bill.register(llm)
    calendar.register(llm)
    # Vision (optional)
    if participant_id_ref is not None:
        vision.register(llm, participant_id_ref)
