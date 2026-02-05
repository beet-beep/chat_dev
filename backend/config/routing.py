from django.urls import re_path

from support.ws_urls import websocket_urlpatterns as support_patterns

websocket_urlpatterns = [*support_patterns]






