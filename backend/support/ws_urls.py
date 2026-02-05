from django.urls import path

from .consumers import AdminInboxConsumer, TicketChatConsumer

websocket_urlpatterns = [
    path("ws/tickets/<int:ticket_id>/", TicketChatConsumer.as_asgi()),
    path("ws/admin/inbox/", AdminInboxConsumer.as_asgi()),
]


