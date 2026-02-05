from __future__ import annotations

from asgiref.sync import async_to_sync


def broadcast_ticket_reply(ticket_id: int, reply_payload: dict):
    """
    Best-effort broadcast. If channels isn't fully configured, do nothing.
    """
    try:
        from channels.layers import get_channel_layer
    except Exception:
        return

    layer = get_channel_layer()
    if not layer:
        return

    async_to_sync(layer.group_send)(
        f"ticket_{ticket_id}",
        {"type": "ticket.reply", "ticket_id": ticket_id, "reply": reply_payload},
    )


def broadcast_ticket_seen(ticket_id: int, payload: dict):
    """
    Best-effort broadcast when ticket read receipt changes.
    Payload example: {"user_seen_at": "..."}
    """
    try:
        from channels.layers import get_channel_layer
    except Exception:
        return

    layer = get_channel_layer()
    if not layer:
        return

    async_to_sync(layer.group_send)(
        f"ticket_{ticket_id}",
        {"type": "ticket.seen", "ticket_id": ticket_id, "payload": payload},
    )


def broadcast_inbox_ticket_created(ticket_payload: dict):
    try:
        from channels.layers import get_channel_layer
    except Exception:
        return
    layer = get_channel_layer()
    if not layer:
        return
    async_to_sync(layer.group_send)("admin_inbox", {"type": "inbox.ticket_created", "ticket": ticket_payload})


def broadcast_inbox_ticket_updated(ticket_id: int, delta: dict):
    try:
        from channels.layers import get_channel_layer
    except Exception:
        return
    layer = get_channel_layer()
    if not layer:
        return
    async_to_sync(layer.group_send)("admin_inbox", {"type": "inbox.ticket_updated", "ticket_id": ticket_id, "delta": delta})


