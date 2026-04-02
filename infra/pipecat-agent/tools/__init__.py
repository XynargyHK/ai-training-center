"""
Tools registry.
- Pipecat-local: translate, switch_language (need TTS access)
- Brain-delegated: send_whatsapp, send_whatsapp_group, schedule_whatsapp, split_bill
"""
from tools import translate, switch_language, send_whatsapp, send_whatsapp_group, schedule_whatsapp, split_bill


def get_schemas():
    return [
        translate.schema,
        switch_language.schema,
        send_whatsapp.schema,
        send_whatsapp_group.schema,
        schedule_whatsapp.schema,
        split_bill.schema,
    ]


def register_all(llm, tts_service):
    translate.register(llm, tts_service)
    switch_language.register(llm, tts_service)
    send_whatsapp.register(llm)
    send_whatsapp_group.register(llm)
    schedule_whatsapp.register(llm)
    split_bill.register(llm)
