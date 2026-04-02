"""
Tools registry.
- Pipecat-local: translate, switch_language, vision (need TTS/transport access)
- Brain-delegated: send_whatsapp, send_whatsapp_group, schedule_whatsapp, split_bill
"""
from tools import translate, switch_language, send_whatsapp, send_whatsapp_group, schedule_whatsapp, split_bill, vision


def get_schemas(include_vision=False):
    schemas = [
        translate.schema,
        switch_language.schema,
        send_whatsapp.schema,
        send_whatsapp_group.schema,
        schedule_whatsapp.schema,
        split_bill.schema,
    ]
    if include_vision:
        schemas.append(vision.schema)
    return schemas


def register_all(llm, tts_service, participant_id_ref=None):
    translate.register(llm, tts_service)
    switch_language.register(llm, tts_service)
    send_whatsapp.register(llm)
    send_whatsapp_group.register(llm)
    schedule_whatsapp.register(llm)
    split_bill.register(llm)
    if participant_id_ref is not None:
        vision.register(llm, participant_id_ref)
