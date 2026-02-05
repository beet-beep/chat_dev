from __future__ import annotations

from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token

from .models import Profile, Ticket


@sync_to_async
def _get_user_from_token(token_key: str | None):
    if not token_key:
        return AnonymousUser()
    try:
        return Token.objects.select_related("user").get(key=token_key).user
    except Token.DoesNotExist:
        return AnonymousUser()


@sync_to_async
def _ticket_allowed(ticket_id: int, user):
    try:
        t = Ticket.objects.select_related("user").get(id=ticket_id)
    except Ticket.DoesNotExist:
        return None
    if not getattr(user, "is_authenticated", False):
        return None
    if user.is_staff or user.is_superuser:
        return t
    return t if t.user_id == user.id else None


@sync_to_async
def _author_payload(user):
    if not getattr(user, "is_authenticated", False):
        return {"id": None, "name": "익명", "avatar_url": "", "is_staff": False}
    Profile.objects.get_or_create(user=user)
    p = user.profile
    name = (p.display_name or user.get_full_name() or getattr(user, "email", "") or user.get_username()).strip() or "사용자"
    return {"id": user.id, "name": name, "avatar_url": p.avatar_url or "", "is_staff": bool(getattr(user, "is_staff", False))}


class TicketChatConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket room per ticket: ws://.../ws/tickets/<ticket_id>/?token=<DRF Token>
    - staff: can join any ticket
    - user: can join only their own ticket
    """

    async def connect(self):
        self.ticket_id = int(self.scope["url_route"]["kwargs"]["ticket_id"])
        qs = parse_qs((self.scope.get("query_string") or b"").decode("utf-8"))
        token_key = (qs.get("token") or [None])[0]
        self.user = await _get_user_from_token(token_key)

        ticket = await _ticket_allowed(self.ticket_id, self.user)
        if not ticket:
            await self.close(code=4401)
            return

        self.group_name = f"ticket_{self.ticket_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({"type": "hello", "ticket_id": self.ticket_id})

    async def disconnect(self, code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            return

    async def receive_json(self, content, **kwargs):
        # REST endpoints persist replies. WS is used for realtime presence (typing) and ping.
        t = content.get("type")
        if t == "ping":
            await self.send_json({"type": "pong"})
            return
        if t == "typing":
            is_typing = bool(content.get("is_typing"))
            author = await _author_payload(self.user)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "ticket.typing",
                    "ticket_id": self.ticket_id,
                    "author": author,
                    "is_typing": is_typing,
                },
            )
            return

    async def ticket_reply(self, event):
        # event: {type: "ticket.reply", reply: {...}, ticket_id: int}
        await self.send_json({"type": "reply", "ticket_id": event.get("ticket_id"), "reply": event.get("reply")})

    async def ticket_typing(self, event):
        await self.send_json(
            {
                "type": "typing",
                "ticket_id": event.get("ticket_id"),
                "author": event.get("author"),
                "is_typing": event.get("is_typing"),
            }
        )

    async def ticket_seen(self, event):
        # event: {type: "ticket.seen", payload: {...}, ticket_id: int}
        await self.send_json({"type": "seen", "ticket_id": event.get("ticket_id"), **(event.get("payload") or {})})


class AdminInboxConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket room for staff to monitor all tickets: ws://.../ws/admin/inbox/?token=<DRF Token>
    """

    async def connect(self):
        qs = parse_qs((self.scope.get("query_string") or b"").decode("utf-8"))
        token_key = (qs.get("token") or [None])[0]
        self.user = await _get_user_from_token(token_key)

        if not getattr(self.user, "is_authenticated", False) or not (self.user.is_staff or self.user.is_superuser):
            await self.close(code=4403)
            return

        self.group_name = "admin_inbox"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def inbox_ticket_created(self, event):
        # event: {type: "inbox.ticket_created", ticket: {...}}
        await self.send_json({"type": "ticket_created", "ticket": event.get("ticket")})

    async def inbox_ticket_updated(self, event):
        # event: {type: "inbox.ticket_updated", ticket_id: int, delta: {...}}
        await self.send_json({"type": "ticket_updated", "ticket_id": event.get("ticket_id"), "delta": event.get("delta")})


