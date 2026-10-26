import uuid

_RAM_WHITEBOARD = {}

def save_dummy_mapping_in_ram(mapping: dict) -> str:
    ticket_id = str(uuid.uuid4())
    _RAM_WHITEBOARD[ticket_id] = mapping
    return ticket_id

def unmask_response_and_wipe_ram(ticket_id: str, ai_reply: str) -> str:
    mapping = _RAM_WHITEBOARD.pop(ticket_id, {})
    clean_reply = ai_reply
    for fake_word, real_word in mapping.items():
        clean_reply = clean_reply.replace(fake_word, real_word)
    return clean_reply