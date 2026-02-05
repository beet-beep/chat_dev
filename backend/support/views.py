from django.contrib.auth import get_user_model
from django.db.models import Q, Count, OuterRef, Subquery
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.core.paginator import InvalidPage
from django.http import FileResponse, Http404
from django.core.files.uploadedfile import InMemoryUploadedFile
import uuid as _uuid
import random as _random
import json as _json
import requests
import logging
import io
from django.conf import settings

logger = logging.getLogger(__name__)


def optimize_image(uploaded_file, max_width=1920, max_height=1920, quality=85):
    """
    Optimize uploaded image: resize if too large, compress JPEG.
    Returns optimized InMemoryUploadedFile or original if not an image.
    """
    content_type = getattr(uploaded_file, "content_type", "") or ""
    if not content_type.startswith("image/"):
        return uploaded_file

    try:
        from PIL import Image

        # Read the image
        img = Image.open(uploaded_file)
        original_format = img.format or "JPEG"

        # Convert RGBA to RGB for JPEG
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Calculate new size maintaining aspect ratio
        width, height = img.size
        if width > max_width or height > max_height:
            ratio = min(max_width / width, max_height / height)
            new_size = (int(width * ratio), int(height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        # Save to buffer
        buffer = io.BytesIO()
        save_format = "JPEG" if original_format.upper() in ("JPEG", "JPG") else original_format
        if save_format.upper() == "PNG":
            img.save(buffer, format="PNG", optimize=True)
            new_content_type = "image/png"
        else:
            img.save(buffer, format="JPEG", quality=quality, optimize=True)
            new_content_type = "image/jpeg"

        buffer.seek(0)

        # Create new uploaded file
        name = getattr(uploaded_file, "name", "image.jpg")
        if save_format.upper() == "JPEG" and not name.lower().endswith((".jpg", ".jpeg")):
            name = name.rsplit(".", 1)[0] + ".jpg"

        return InMemoryUploadedFile(
            file=buffer,
            field_name="file",
            name=name,
            content_type=new_content_type,
            size=buffer.getbuffer().nbytes,
            charset=None,
        )
    except Exception as e:
        logger.warning(f"Image optimization failed: {e}")
        uploaded_file.seek(0)
        return uploaded_file


def call_openrouter_api(prompt: str, system_instruction: str = "") -> str:
    """Call OpenRouter API for AI response generation."""
    api_key = getattr(settings, "OPENROUTER_API_KEY", "")
    model = getattr(settings, "OPENROUTER_MODEL", "google/gemini-2.5-pro-preview-03-25")

    if not api_key:
        return ""

    try:
        url = "https://openrouter.ai/api/v1/chat/completions"

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": 2048,
            "temperature": 0.7,
            "top_p": 0.95,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://joody.local",
            "X-Title": "Joody Support"
        }

        response = requests.post(url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()

        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0].get("message", {}).get("content", "")
        return ""
    except Exception as e:
        logger.error(f"OpenRouter API error: {e}")
        return ""


def call_gemini_api(prompt: str, system_instruction: str = "") -> str:
    """Fallback to Gemini API if OpenRouter fails."""
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        return ""

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
                "topP": 0.95,
            }
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()

        data = response.json()
        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                return candidate["content"]["parts"][0].get("text", "")
        return ""
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return ""

LANG_NAMES = {"en": "English", "ja": "Japanese", "zh-TW": "Traditional Chinese (Taiwan)"}


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_translate(request):
    """Translate text from source language to multiple target languages using AI."""
    items = request.data.get("items", [])
    source_lang = request.data.get("source_lang", "ko")
    target_langs = request.data.get("target_langs", ["en", "ja", "zh-TW"])

    if not items:
        return Response({"error": "items required"}, status=400)
    if len(items) > 10:
        return Response({"error": "max 10 items"}, status=400)

    # Build a single prompt for all items and all languages
    target_names = [f"{LANG_NAMES.get(l, l)} ({l})" for l in target_langs]
    prompt_parts = []
    for item in items:
        key = item.get("key", "text")
        text = item.get("text", "")
        is_html = item.get("is_html", False)
        if not text.strip():
            continue
        prompt_parts.append(f'[{key}] (html={is_html}):\n"""\n{text}\n"""')

    if not prompt_parts:
        return Response({"results": {}})

    system_instruction = (
        "You are a professional translator. Translate the given texts accurately and naturally. "
        "Maintain the tone, nuance, and formatting of the original. "
        "For HTML content (html=true), preserve ALL HTML tags, attributes, and structure exactly — only translate the visible text content. "
        "For plain text (html=false), translate naturally without adding any HTML. "
        "Respond ONLY with valid JSON, no markdown fences."
    )

    prompt = (
        f"Translate the following texts from Korean to {', '.join(target_names)}.\n\n"
        + "\n\n".join(prompt_parts)
        + "\n\nRespond as JSON: { \"<key>\": { \"<lang_code>\": \"translated text\", ... }, ... }\n"
        "Example: { \"title\": { \"en\": \"...\", \"ja\": \"...\", \"zh-TW\": \"...\" } }"
    )

    source = "openrouter"
    raw = call_openrouter_api(prompt, system_instruction)
    if not raw:
        source = "gemini"
        raw = call_gemini_api(prompt, system_instruction)
    if not raw:
        return Response({"error": "Translation service unavailable"}, status=503)

    # Parse JSON from response (strip markdown fences if present)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        results = _json.loads(cleaned)
    except _json.JSONDecodeError:
        logger.error(f"Translation JSON parse error: {cleaned[:500]}")
        return Response({"error": "Failed to parse translation", "raw": cleaned[:1000]}, status=502)

    return Response({"results": results, "source": source})


from .realtime import (
    broadcast_ticket_reply,
    broadcast_ticket_seen,
    broadcast_inbox_ticket_created,
    broadcast_inbox_ticket_updated,
)
from .models import (
    FAQ,
    FAQAttachment,
    FAQCategory,
    FAQView,
    Profile,
    Ticket,
    TicketAttachment,
    TicketCategory,
    TicketReply,
    TicketReplyAttachment,
    TicketNote,
    TicketTag,
    TicketTagAssignment,
    SupportTeam,
    AiLibraryItem,
    ChatTemplate,
    AppSettings,
    VocEntry,
)
from .serializers import (
    FAQCategorySerializer,
    FAQAttachmentSerializer,
    FAQSerializer,
    VocEntrySerializer,
    AdminTicketSerializer,
    LoginSerializer,
    MeSerializer,
    RegisterSerializer,
    TicketCategorySerializer,
    TicketReplyCreateSerializer,
    TicketReplySerializer,
    TicketSerializer,
    TicketNoteSerializer,
    TicketTagSerializer,
    # AdminInboxViewSerializer,
    # SupportTagSerializer,
    # SupportChannelSerializer,
    # SupportTeamSerializer,
    AiLibraryItemSerializer,
    AppSettingsSerializer,
)

# NOTE: _profile_avatar_url is defined in serializers.py; import locally to avoid circulars.
from .serializers import _profile_avatar_url

User = get_user_model()


def _update_cumulative_spend(user, client_meta):
    """
    Helper to update user's cumulative spend and VIP status based on client_meta purchases.
    """
    if not isinstance(client_meta, dict):
        return
    try:
        Profile.objects.get_or_create(user=user)
        p = user.profile
        pi = p.payment_info if isinstance(getattr(p, "payment_info", None), dict) else {}
        total = int(pi.get("total_spend_krw") or 0)
        seen = set(str(x) for x in (pi.get("seen_purchase_tx_ids") or []) if str(x).strip())

        purchases = client_meta.get("purchases") if isinstance(client_meta.get("purchases"), dict) else {}
        recent = purchases.get("recent") if isinstance(purchases.get("recent"), list) else []
        added = 0
        for r in recent:
            if not isinstance(r, dict):
                continue
            txid = r.get("id")
            if txid in [None, ""]:
                continue
            txid_s = str(txid)
            if txid_s in seen:
                continue
            meta = r.get("meta") if isinstance(r.get("meta"), dict) else {}
            price = meta.get("price_krw") or 0
            try:
                price_i = int(price)
            except Exception:
                price_i = 0
            seen.add(txid_s)
            added += max(0, price_i)

        if added:
            total += added
            pi["total_spend_krw"] = total
            pi["seen_purchase_tx_ids"] = list(seen)[-500:]
            pi["last_purchase_at"] = timezone.now().isoformat()
            p.payment_info = pi

        # VIP rule: >= 1,000,000 KRW
        should_vip = total >= 1_000_000
        tags = p.tags if isinstance(getattr(p, "tags", None), list) else []
        if should_vip and "VIP" not in tags:
            tags = [*tags, "VIP"]
        if (not should_vip) and "VIP" in tags:
            tags = [t for t in tags if t != "VIP"]
        p.tags = tags
        p.is_vip = bool(should_vip)
        p.save()
    except Exception:
        pass


class FAQCategoryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = FAQCategory.objects.all()
    serializer_class = FAQCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class FAQViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = FAQSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = FAQ.objects.select_related("category").prefetch_related("attachments").filter(is_hidden=False)
        category_id = self.request.query_params.get("category_id")
        kind = self.request.query_params.get("kind")
        is_popular = self.request.query_params.get("is_popular")
        q = self.request.query_params.get("q")
        lang = self.request.query_params.get("lang")

        if lang:
            qs = qs.filter(lang=lang)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if kind:
            qs = qs.filter(category__kind=kind)
        if is_popular is not None:
            qs = qs.filter(is_popular=is_popular.lower() in ["1", "true", "yes", "y"])
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(body__icontains=q))
        return qs

    @action(detail=True, methods=["post"])
    def track_view(self, request, pk=None):
        """Track FAQ view for analytics. Deduplicates by user/session per FAQ per day."""
        faq = self.get_object()
        user = request.user if request.user.is_authenticated else None
        session_id = request.data.get("session_id", "")[:64] if not user else ""

        # Deduplicate: only count one view per user/session per FAQ per day
        today = timezone.now().date()
        existing = FAQView.objects.filter(
            faq=faq,
            viewed_at__date=today
        )
        if user:
            existing = existing.filter(user=user)
        elif session_id:
            existing = existing.filter(session_id=session_id)
        else:
            existing = existing.none()  # Always count anonymous views without session

        if not existing.exists():
            FAQView.objects.create(faq=faq, user=user, session_id=session_id)
            faq.view_count = (faq.view_count or 0) + 1
            faq.save(update_fields=["view_count"])

        return Response({"success": True, "view_count": faq.view_count})


class AdminFAQCategoryViewSet(viewsets.ModelViewSet):
    queryset = FAQCategory.objects.all()
    serializer_class = FAQCategorySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class AdminFAQViewSet(viewsets.ModelViewSet):
    serializer_class = FAQSerializer
    permission_classes = [permissions.IsAdminUser]
    # Support JSON for normal create/update, and multipart for attachment upload.
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = None

    def get_queryset(self):
        qs = FAQ.objects.select_related("category").prefetch_related("attachments").all()
        lang = self.request.query_params.get("lang")
        if lang:
            qs = qs.filter(lang=lang)
        return qs

    @action(detail=True, methods=["post"])
    def upload(self, request, pk=None):
        faq: FAQ = self.get_object()
        files = request.FILES.getlist("files")
        created = []
        for f in files:
            a = FAQAttachment.objects.create(
                faq=faq,
                uploaded_by=request.user,
                file=f,
                original_name=getattr(f, "name", "") or "",
                content_type=getattr(f, "content_type", "") or "",
            )
            created.append(a)
        # return attachment objects so UI can immediately insert URLs into blocks
        ser = FAQAttachmentSerializer(created, many=True, context={"request": request})
        return Response({"attachments": ser.data})


class AdminCustomerViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        return User.objects.select_related("profile").all()

    def list(self, request, *args, **kwargs):
        q = request.query_params.get("q", "").strip().lower()
        qs = self.get_queryset()
        if q:
            qs = qs.filter(Q(email__icontains=q) | Q(username__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q))

        # Perf: avoid N+1 queries by annotating ticket stats via subqueries.
        last_ticket_qs = Ticket.objects.filter(user=OuterRef("pk")).order_by("-created_at")
        qs = qs.annotate(
            ticket_count=Count("tickets"),
            last_ticket_at=Subquery(last_ticket_qs.values("created_at")[:1]),
            last_channel=Subquery(last_ticket_qs.values("channel")[:1]),
            last_entry_source=Subquery(last_ticket_qs.values("entry_source")[:1]),
            last_device=Subquery(last_ticket_qs.values("user_device")[:1]),
            last_locale=Subquery(last_ticket_qs.values("user_locale")[:1]),
            last_location=Subquery(last_ticket_qs.values("user_location")[:1]),
        )
        out = []
        for u in qs[:200]:
            Profile.objects.get_or_create(user=u)
            p = u.profile
            pi = p.payment_info if isinstance(getattr(p, "payment_info", None), dict) else {}
            last_purchase_at = ""
            try:
                if isinstance(pi, dict) and pi.get("last_purchase_at"):
                    last_purchase_at = str(pi.get("last_purchase_at"))
            except Exception:
                last_purchase_at = ""
            out.append(
                {
                    "id": u.id,
                    "email": u.email,
                    "name": u.get_full_name() or u.first_name or u.username,
                    "uuid": p.game_uuid or u.username,
                    "display_name": p.display_name,
                    "member_code": p.member_code,
                    "game_uuid": p.game_uuid or u.username,
                    "login_provider": p.login_provider,
                    "avatar_url": _profile_avatar_url(request, p),
                    "phone_number": p.phone_number,
                    "is_vip": p.is_vip,
                    "tags": p.tags,
                    "notes": p.notes,
                    "total_spend_krw": int(pi.get("total_spend_krw") or 0),
                    "ticket_count": int(getattr(u, "ticket_count", 0) or 0),
                    "joined_at": getattr(u, "date_joined", None).isoformat() if getattr(u, "date_joined", None) else "",
                    "last_ticket_at": getattr(u, "last_ticket_at", None).isoformat() if getattr(u, "last_ticket_at", None) else "",
                    "last_channel": str(getattr(u, "last_channel", "") or ""),
                    "last_entry_source": str(getattr(u, "last_entry_source", "") or ""),
                    "device": str(getattr(u, "last_device", "") or ""),
                    "locale": str(getattr(u, "last_locale", "") or ""),
                    "location": str(getattr(u, "last_location", "") or ""),
                    "last_purchase_at": last_purchase_at,
                }
            )
        return Response(out)

    def retrieve(self, request, pk=None):
        u = self.get_queryset().get(pk=pk)
        Profile.objects.get_or_create(user=u)
        p = u.profile
        pi = p.payment_info if isinstance(getattr(p, "payment_info", None), dict) else {}
        ticket_count = Ticket.objects.filter(user=u).count()
        last_ticket = Ticket.objects.filter(user=u).order_by("-created_at").first()
        last_purchase_at = ""
        try:
            if isinstance(pi, dict) and pi.get("last_purchase_at"):
                last_purchase_at = str(pi.get("last_purchase_at"))
        except Exception:
            last_purchase_at = ""
        return Response(
            {
                "id": u.id,
                "email": u.email,
                "name": u.get_full_name() or u.first_name or u.username,
                "uuid": p.game_uuid or u.username,
                "display_name": p.display_name,
                "member_code": p.member_code,
                "game_uuid": p.game_uuid or u.username,
                "login_provider": p.login_provider,
                "avatar_url": _profile_avatar_url(request, p),
                "phone_number": p.phone_number,
                "is_vip": p.is_vip,
                "tags": p.tags,
                "notes": p.notes,
                "total_spend_krw": int(pi.get("total_spend_krw") or 0),
                "ticket_count": ticket_count,
                "joined_at": getattr(u, "date_joined", None).isoformat() if getattr(u, "date_joined", None) else "",
                "last_ticket_at": last_ticket.created_at.isoformat() if last_ticket else "",
                "last_channel": (last_ticket.channel if last_ticket else "") or "",
                "last_entry_source": (last_ticket.entry_source if last_ticket else "") or "",
                "device": (last_ticket.user_device if last_ticket else "") or "",
                "locale": (last_ticket.user_locale if last_ticket else "") or "",
                "location": (last_ticket.user_location if last_ticket else "") or "",
                "last_purchase_at": last_purchase_at,
            }
        )

    def partial_update(self, request, pk=None):
        u = self.get_queryset().get(pk=pk)
        Profile.objects.get_or_create(user=u)
        p = u.profile
        data = request.data or {}
        if "phone_number" in data:
            p.phone_number = data.get("phone_number") or ""
        if "is_vip" in data:
            p.is_vip = bool(data.get("is_vip"))
        if "tags" in data:
            p.tags = data.get("tags") or []
        if "notes" in data:
            p.notes = data.get("notes") or ""
        p.save()
        return self.retrieve(request, pk=pk)


class TicketCategoryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = TicketCategory.objects.all()
    serializer_class = TicketCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class AdminTicketCategoryViewSet(viewsets.ModelViewSet):
    queryset = TicketCategory.objects.all()
    serializer_class = TicketCategorySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    parser_classes = [MultiPartParser, FormParser]
    class Pagination(PageNumberPagination):
        page_size = 10
        page_size_query_param = "page_size"
        max_page_size = 200

        # Avoid 404 on out-of-range pages: clamp to last page (or empty).
        def paginate_queryset(self, queryset, request, view=None):
            page_size = self.get_page_size(request)
            if not page_size:
                return None
            paginator = self.django_paginator_class(queryset, page_size)
            page_number = request.query_params.get(self.page_query_param, 1)
            try:
                self.page = paginator.page(page_number)
            except InvalidPage:
                if paginator.num_pages <= 0:
                    self.page = paginator.page(1)
                else:
                    self.page = paginator.page(paginator.num_pages)
            self.request = request
            return list(self.page)

    pagination_class = Pagination

    def get_queryset(self):
        return (
            Ticket.objects.select_related("category")
            .prefetch_related("attachments", "replies", "replies__author", "replies__attachments")
            .filter(user=self.request.user)
        )

    def perform_create(self, serializer):
        ticket: Ticket = serializer.save(user=self.request.user)
        # Capture structured client_meta (best-effort). For multipart requests it can arrive as a JSON string.
        try:
            raw_meta = self.request.data.get("client_meta")
            client_meta = None
            if isinstance(raw_meta, dict):
                client_meta = raw_meta
            elif isinstance(raw_meta, str) and raw_meta.strip():
                try:
                    parsed = _json.loads(raw_meta)
                    if isinstance(parsed, dict):
                        client_meta = parsed
                except Exception:
                    client_meta = None
            if isinstance(client_meta, dict):
                ticket.client_meta = client_meta
                ticket.save(update_fields=["client_meta", "updated_at"])
                # Update user's cumulative spend (admin-only) and VIP tagging.
                _update_cumulative_spend(self.request.user, client_meta)
        except Exception:
            pass

        # Broadcast to admin inbox
        try:
            broadcast_inbox_ticket_created(AdminTicketSerializer(ticket).data)
        except Exception:
            pass
        # Best-effort client context (device/locale/location)
        try:
            if not (ticket.user_device or "").strip():
                ua = (self.request.META.get("HTTP_USER_AGENT") or "").strip()
                ticket.user_device = ua[:200]
            if not (ticket.user_locale or "").strip():
                al = (self.request.META.get("HTTP_ACCEPT_LANGUAGE") or "").strip()
                # e.g. "ko-KR,ko;q=0.9,en-US;q=0.8"
                first = (al.split(",")[0] if al else "").strip()
                ticket.user_locale = first[:40]
            # location is client-provided (timezone or free-form)
            if not (ticket.user_location or "").strip():
                tz = (self.request.data.get("client_tz") or self.request.data.get("client_location") or "").strip()
                ticket.user_location = tz[:80]
            ticket.save(update_fields=["user_device", "user_locale", "user_location", "updated_at"])
        except Exception:
            pass
        files = self.request.FILES.getlist("files")
        for f in files:
            # 이미지 최적화 (큰 이미지 자동 리사이즈)
            optimized = optimize_image(f)
            TicketAttachment.objects.create(
                ticket=ticket,
                uploaded_by=self.request.user,
                file=optimized,
                original_name=getattr(f, "name", "") or "",
                content_type=getattr(optimized, "content_type", "") or getattr(f, "content_type", "") or "",
            )

    @action(detail=True, methods=["post"])
    def replies(self, request, pk=None):
        ticket: Ticket = self.get_object()
        ser = TicketReplyCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        reply = TicketReply.objects.create(ticket=ticket, author=request.user, body=ser.validated_data["body"])

        # Capture client_meta for replies as well (best-effort)
        try:
            raw_meta = request.data.get("client_meta")
            client_meta = None
            if isinstance(raw_meta, dict):
                client_meta = raw_meta
            elif isinstance(raw_meta, str) and raw_meta.strip():
                try:
                    parsed = _json.loads(raw_meta)
                    if isinstance(parsed, dict):
                        client_meta = parsed
                except Exception:
                    client_meta = None
            if client_meta:
                _update_cumulative_spend(request.user, client_meta)
        except Exception:
            pass

        files = request.FILES.getlist("files")
        for f in files:
            # 이미지 최적화 (큰 이미지 자동 리사이즈)
            optimized = optimize_image(f)
            TicketReplyAttachment.objects.create(
                reply=reply,
                uploaded_by=request.user,
                file=optimized,
                original_name=getattr(f, "name", "") or "",
                content_type=getattr(optimized, "content_type", "") or getattr(f, "content_type", "") or "",
            )

        # 종료된 문의에 유저가 답글을 달면 자동으로 진행중(PENDING)으로 재오픈
        if ticket.status == "CLOSED":
            ticket.status = "PENDING"
            ticket.reopened_at = timezone.now()
            ticket.save(update_fields=["status", "reopened_at", "updated_at"])
            broadcast_inbox_ticket_updated(ticket.id, {
                "status": "PENDING",
                "status_label": "진행중",
                "reopened_at": ticket.reopened_at.isoformat(),
            })

        payload = TicketReplySerializer(reply, context={"request": request}).data
        broadcast_ticket_reply(ticket.id, payload)
        return Response(payload, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def seen(self, request, pk=None):
        """
        유저(티켓 소유자) read receipt 갱신.
        - admin UI에서만 '유저가 읽었는지' 확인할 수 있도록 서버에 저장한다.
        """
        ticket: Ticket = self.get_object()
        ticket.user_seen_at = timezone.now()
        ticket.save(update_fields=["user_seen_at", "updated_at"])
        payload = {"user_seen_at": ticket.user_seen_at.isoformat()}
        broadcast_ticket_seen(ticket.id, payload)
        return Response(payload)


class TicketAttachmentFileView(APIView):
    """
    Serve ticket / reply attachments via opaque UUID URLs.
    This prevents exposing ticket IDs / paths in the client while still allowing inline view & download.
    """

    # NOTE: We intentionally allow anonymous access to opaque UUID attachment URLs
    # so <img>/<video> tags can render without Authorization headers.
    # The UUID itself is not guessable and ticket APIs remain auth-protected.
    permission_classes = [permissions.AllowAny]

    def get(self, request, public_id):
        from .models import TicketAttachment, TicketReplyAttachment

        a = TicketAttachment.objects.filter(public_id=public_id).select_related("ticket", "ticket__user").first()
        r = None
        if not a:
            r = (
                TicketReplyAttachment.objects.filter(public_id=public_id)
                .select_related("reply", "reply__ticket", "reply__ticket__user")
                .first()
            )
        if not a and not r:
            raise Http404()

        file_field = a.file if a else r.file  # type: ignore
        content_type = (a.content_type if a else r.content_type) or "application/octet-stream"  # type: ignore
        filename = (a.original_name if a else r.original_name) or "attachment"  # type: ignore

        resp = FileResponse(file_field.open("rb"), content_type=content_type)
        dl = request.query_params.get("download")
        if dl in ["1", "true", "yes", "y"]:
            resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        else:
            resp["Content-Disposition"] = f'inline; filename="{filename}"'
        resp["X-Content-Type-Options"] = "nosniff"
        return resp


class AdminTicketViewSet(viewsets.ModelViewSet):
    """
    운영자(스태프) 전용: 전체 티켓 조회/상태변경/운영자 답변 등록
    """

    serializer_class = AdminTicketSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Ticket.objects.select_related("category", "user").prefetch_related(
            "attachments", "replies", "replies__author", "replies__attachments", "notes", "notes__author"
        ).all()

    @action(detail=True, methods=["post"])
    def ai_generate_reply(self, request, pk=None):
        """
        Admin-only: generate a suggested reply for this ticket using AI.
        Uses OpenRouter/Gemini API if available, falls back to heuristic-based responses.
        Only uses message content - NO personal info (name, email, etc.)
        """
        ticket: Ticket = self.get_object()
        try:
            body = (ticket.body or "")
            title = (ticket.title or "")
            body_lower = body.lower()
            title_lower = title.lower()
        except Exception:
            body = ""
            title = ""
            body_lower = ""
            title_lower = ""

        # Collect conversation history for context (MESSAGE CONTENT ONLY - no personal info)
        conversation_history = []
        conversation_history.append(f"[고객 최초 문의]\n제목: {title}\n내용: {body}")

        for r in ticket.replies.all().order_by("created_at"):
            is_staff = r.author and r.author.is_staff
            prefix = "[상담원 답변]" if is_staff else "[고객 추가 메시지]"
            conversation_history.append(f"{prefix}\n{r.body}")

        conversation_text = "\n\n".join(conversation_history)  # All messages

        # System prompt for AI
        system_prompt = """당신은 '주디(Joody)'라는 게임 고객센터의 전문 상담원입니다.

**핵심 원칙:**
- 친절하고 공감하는 어조로 답변하세요
- 고객의 문제를 정확히 파악하고 해결책을 제시하세요
- 불필요한 말을 줄이고 핵심만 전달하세요
- 한국어 존댓말을 사용하세요
- 절대로 거짓 정보를 제공하지 마세요
- 확인이 필요한 사항은 확인 후 안내드리겠다고 말하세요
- 고객 이름을 언급하지 마세요 (개인정보 보호)

**답변 형식:**
- 인사 (간단히, 이름 언급 없이)
- 문제 인식 표현
- 해결책 또는 안내
- 마무리 인사

**주의사항:**
- 환불/결제 관련: 내부 규정에 따라 검토 후 안내드린다고 답변
- 계정 문제: 본인 확인 절차가 필요할 수 있음을 안내
- 버그/오류: 스크린샷이나 상세 정보 요청
- 모르는 정보는 확인 후 안내드린다고 답변
- 대화 내용 전체를 파악하여 맥락에 맞는 답변 작성"""

        user_prompt = f"""다음 고객 문의 대화 전체를 분석하고, 상담원으로서 적절한 답변을 작성해주세요.

--- 전체 대화 내역 ---
{conversation_text}
--- 대화 끝 ---

위 대화 전체를 꼼꼼히 파악한 후, 고객의 마지막 메시지에 대해 자연스럽고 도움이 되는 답변을 작성해주세요.
답변에는 고객 이름이나 개인정보를 포함하지 마세요."""

        # Try OpenRouter API first (uses Gemini 2.5 Pro Preview)
        if getattr(settings, "OPENROUTER_API_KEY", ""):
            ai_reply = call_openrouter_api(user_prompt, system_prompt)
            if ai_reply and ai_reply.strip():
                return Response({"reply": ai_reply.strip(), "source": "openrouter"})

        # Fallback to direct Gemini API
        if getattr(settings, "GEMINI_API_KEY", ""):
            ai_reply = call_gemini_api(user_prompt, system_prompt)
            if ai_reply and ai_reply.strip():
                return Response({"reply": ai_reply.strip(), "source": "gemini"})

        # Fallback to heuristic-based responses
        if "결제" in body_lower or "환불" in body_lower or "결제" in title_lower:
            reply = "안녕하세요, 주디 고객센터입니다. 결제 관련하여 불편을 드려 죄송합니다. 요청하신 결제 내역을 확인 중에 있으며, 내부 규정에 따라 환불 가능 여부를 검토 후 안내드리겠습니다. 잠시만 기다려 주시면 감사하겠습니다."
        elif "계정" in body_lower or "로그인" in body_lower or "계정" in title_lower:
            reply = "안녕하세요! 계정 관련 문의를 주셨군요. 현재 안내해주신 UUID와 이메일을 바탕으로 계정 상태를 확인하고 있습니다. 본인 확인을 위해 추가적인 정보가 필요할 경우 다시 요청드릴 수 있는 점 양해 부탁드립니다."
        elif "오류" in body_lower or "버그" in body_lower or "안돼" in body_lower:
            reply = "불편을 드려 정말 죄송합니다. 말씀해주신 현상은 담당 부서에 전달하여 원인을 파악하고 있습니다. 원활한 확인을 위해 문제가 발생한 화면의 스크린샷이나 영상을 첨부해주시면 더 빠른 처리가 가능합니다."
        else:
            reply = f"안녕하세요, {customer_name}님! 문의해주신 '{title}' 건에 대해 담당자가 확인 중에 있습니다. 정성껏 검토하여 빠른 시일 내에 답변드릴 수 있도록 하겠습니다. 주디를 이용해주셔서 감사합니다."

        return Response({"reply": reply, "source": "heuristic"})

    @action(detail=True, methods=["post"])
    def staff_reply(self, request, pk=None):
        ticket: Ticket = self.get_object()
        ser = TicketReplyCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        # 운영자 답변도 실제 작성자(상담원) 정보를 저장해 ChannelTalk 스타일 UI(아바타/닉네임)를 지원
        Profile.objects.get_or_create(user=request.user)
        reply = TicketReply.objects.create(ticket=ticket, author=request.user, body=ser.validated_data["body"])
        files = request.FILES.getlist("files")
        for f in files:
            # 이미지 최적화 (큰 이미지 자동 리사이즈)
            optimized = optimize_image(f)
            TicketReplyAttachment.objects.create(
                reply=reply,
                uploaded_by=request.user,
                file=optimized,
                original_name=getattr(f, "name", "") or "",
                content_type=getattr(optimized, "content_type", "") or getattr(f, "content_type", "") or "",
            )
        # 답변 등록 시 상태를 자동으로 변경하지 않음 (관리자가 수동으로 상태 관리)
        # if ticket.status != Ticket.Status.ANSWERED:
        #     ticket.status = Ticket.Status.ANSWERED
        #     ticket.save(update_fields=["status", "updated_at"])
        #     broadcast_inbox_ticket_updated(ticket.id, {"status": ticket.status, "status_label": ticket.get_status_display()})
        # else:
        #     ticket.updated_at = timezone.now()
        #     ticket.save(update_fields=["updated_at"])
        #     broadcast_inbox_ticket_updated(ticket.id, {"updated_at": ticket.updated_at.isoformat()})
        
        # 답변 등록 시에도 updated_at만 갱신
        ticket.updated_at = timezone.now()
        ticket.save(update_fields=["updated_at"])
        broadcast_inbox_ticket_updated(ticket.id, {"updated_at": ticket.updated_at.isoformat()})

        payload = TicketReplySerializer(reply, context={"request": request}).data
        broadcast_ticket_reply(ticket.id, payload)
        return Response(payload, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def seen(self, request, pk=None):
        """
        운영자 read receipt 갱신 (유저에게는 노출/브로드캐스트하지 않음).
        """
        ticket: Ticket = self.get_object()
        ticket.staff_seen_at = timezone.now()
        ticket.save(update_fields=["staff_seen_at", "updated_at"])
        return Response({"staff_seen_at": ticket.staff_seen_at.isoformat()})

    @action(detail=True, methods=["post"])
    def note(self, request, pk=None):
        ticket: Ticket = self.get_object()
        body = (request.data.get("body") or "").strip()
        if not body:
            return Response({"body": "Required"}, status=status.HTTP_400_BAD_REQUEST)
        n = ticket.notes.create(author=request.user, body=body)
        broadcast_inbox_ticket_updated(ticket.id, {"has_new_note": True})
        return Response(TicketNoteSerializer(n).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def notes(self, request, pk=None):
        ticket: Ticket = self.get_object()
        ser = TicketNoteSerializer(ticket.notes.all(), many=True)
        return Response(ser.data)

    @action(detail=True, methods=["patch"])
    def set_meta(self, request, pk=None):
        ticket: Ticket = self.get_object()
        data = request.data or {}
        delta = {}
        if "assignee_id" in data:
            assignee_id = data.get("assignee_id")
            if assignee_id in [None, "", 0, "0"]:
                ticket.assignee_id = None
            else:
                if not User.objects.filter(id=assignee_id, is_staff=True).exists():
                    return Response({"assignee_id": "Invalid staff user"}, status=status.HTTP_400_BAD_REQUEST)
                ticket.assignee_id = assignee_id
            delta["assignee_id"] = ticket.assignee_id
        if "priority" in data:
            ticket.priority = data.get("priority") or "NORMAL"
            delta["priority"] = ticket.priority
        if "channel" in data:
            ticket.channel = data.get("channel") or "inapp"
            delta["channel"] = ticket.channel
        if "team" in data:
            ticket.team = data.get("team") or ""
            delta["team"] = ticket.team
        if "tags" in data:
            old_tags = set(t.lower() for t in (ticket.tags or []))
            ticket.tags = data.get("tags") or []
            delta["tags"] = ticket.tags
            new_tags = set(t.lower() for t in ticket.tags)
            added_tags = new_tags - old_tags
            # 버그/건의사항 태그 추가 시 자동 VOC 수집
            _auto_create_voc(ticket, added_tags, request.user)
        ticket.save()
        if delta:
            broadcast_inbox_ticket_updated(ticket.id, delta)
        return Response(AdminTicketSerializer(ticket).data)

    @action(detail=True, methods=["patch"])
    def set_status(self, request, pk=None):
        ticket: Ticket = self.get_object()
        status_value = request.data.get("status")
        allowed = {"PENDING", "ANSWERED", "CLOSED"}
        if status_value not in allowed:
            return Response({"status": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = status_value
        ticket.save(update_fields=["status", "updated_at"])
        broadcast_inbox_ticket_updated(ticket.id, {"status": status_value, "status_label": ticket.get_status_display()})
        return Response(AdminTicketSerializer(ticket).data)

    @action(detail=False, methods=["post"])
    def bulk_set_status(self, request):
        """
        Bulk status update for admin inbox actions (e.g., '일괄 종료').
        Body: { ids: number[], status: "PENDING"|"ANSWERED"|"CLOSED" }
        """
        data = request.data or {}
        ids = data.get("ids") or []
        status_value = data.get("status")
        allowed = {"PENDING", "ANSWERED", "CLOSED"}
        if status_value not in allowed:
            return Response({"status": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "Required"}, status=status.HTTP_400_BAD_REQUEST)
        ids = [int(x) for x in ids if str(x).isdigit()]
        qs = Ticket.objects.filter(id__in=ids)
        updated = qs.update(status=status_value, updated_at=timezone.now())
        return Response({"updated": updated, "status": status_value})


class AdminAgentViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        out = []
        for u in User.objects.filter(is_staff=True).order_by("id")[:200]:
            Profile.objects.get_or_create(user=u)
            p = u.profile
            out.append(
                {
                    "id": u.id,
                    "email": getattr(u, "email", "") or "",
                    "name": (p.display_name or u.get_full_name() or u.first_name or u.username).strip(),
                    "avatar_url": _profile_avatar_url(request, p),
                    "status_message": getattr(p, "status_message", "") or "",
                }
            )
        return Response(out)


# class AdminInboxViewViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAdminUser]
#     serializer_class = AdminInboxViewSerializer
#     pagination_class = None
#
#     def get_queryset(self):
#         return AdminInboxView.objects.filter(Q(owner=self.request.user) | Q(scope="TEAM"))
#
#     def perform_create(self, serializer):
#         serializer.save(owner=self.request.user)
#
#     def perform_update(self, serializer):
#         obj = self.get_object()
#         if obj.owner_id != self.request.user.id and not self.request.user.is_superuser:
#             raise PermissionDenied("Only owner can update this view")
#         serializer.save()
#
#     def perform_destroy(self, instance):
#         if instance.owner_id != self.request.user.id and not self.request.user.is_superuser:
#             raise PermissionDenied("Only owner can delete this view")
#         instance.delete()


# class AdminSupportTagViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAdminUser]
#     serializer_class = SupportTagSerializer
#     pagination_class = None
#     queryset = SupportTag.objects.all()


class AdminTicketTagViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = TicketTagSerializer
    pagination_class = None
    queryset = TicketTag.objects.filter(parent__isnull=True).prefetch_related('children')


# class AdminSupportChannelViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAdminUser]
#     serializer_class = SupportChannelSerializer
#     pagination_class = None
#     queryset = SupportChannel.objects.all()
#
#
# class AdminSupportTeamViewSet(viewsets.ModelViewSet):
#     permission_classes = [permissions.IsAdminUser]
#     serializer_class = SupportTeamSerializer
#     pagination_class = None
#     queryset = SupportTeam.objects.all()


class AdminAiLibraryItemViewSet(viewsets.ModelViewSet):
    """
    Admin-only AI learning library CRUD.
    """

    permission_classes = [permissions.IsAdminUser]
    serializer_class = AiLibraryItemSerializer
    pagination_class = None

    def get_queryset(self):
        return AiLibraryItem.objects.select_related("created_by", "ticket").all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["post"])
    def ai_enhance(self, request):
        """
        Use AI to enhance and summarize the learning data.
        Takes context and final_reply, returns enhanced knowledge summary.
        """
        context = request.data.get("context", "")
        generated_reply = request.data.get("generated_reply", "")
        final_reply = request.data.get("final_reply", "")

        if not context or not final_reply:
            return Response({"error": "context and final_reply are required"}, status=400)

        system_prompt = """당신은 고객 서비스 학습 데이터를 분석하고 정제하는 전문가입니다.

**작업:**
주어진 고객 문의(context)와 상담원의 최종 답변(final_reply)을 분석하여:
1. 핵심 문의 유형 분류 (예: 결제, 계정, 버그, 일반문의 등)
2. 고객의 핵심 요구사항 요약 (1-2문장)
3. 효과적인 답변 패턴 추출
4. 향후 유사 문의에 적용할 수 있는 핵심 키워드/태그 추천 (3-5개)

**출력 형식:**
JSON 형식으로 응답해주세요:
{
  "category": "분류",
  "customer_intent": "고객 요구 요약",
  "answer_pattern": "효과적인 답변 패턴",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "quality_score": 1-10 점수 (답변 품질 평가)
}"""

        user_prompt = f"""다음 고객 서비스 대화를 분석해주세요.

**고객 문의 (Context):**
{context}

**AI 생성 답변 (참고용):**
{generated_reply}

**상담원 최종 답변:**
{final_reply}

위 내용을 분석하여 학습 데이터로 정제해주세요."""

        # Try OpenRouter first
        if getattr(settings, "OPENROUTER_API_KEY", ""):
            result = call_openrouter_api(user_prompt, system_prompt)
            if result:
                try:
                    import json
                    # Try to parse JSON from the response
                    json_match = result.strip()
                    if "```json" in json_match:
                        json_match = json_match.split("```json")[1].split("```")[0].strip()
                    elif "```" in json_match:
                        json_match = json_match.split("```")[1].split("```")[0].strip()
                    enhanced_data = json.loads(json_match)
                    return Response({"success": True, "enhanced": enhanced_data, "source": "openrouter"})
                except Exception as e:
                    logger.warning(f"Failed to parse AI response as JSON: {e}")
                    return Response({"success": True, "enhanced": {"raw": result}, "source": "openrouter"})

        # Fallback: simple extraction
        return Response({
            "success": True,
            "enhanced": {
                "category": "일반문의",
                "customer_intent": context[:100] + "..." if len(context) > 100 else context,
                "answer_pattern": final_reply[:200] + "..." if len(final_reply) > 200 else final_reply,
                "keywords": [],
                "quality_score": 7
            },
            "source": "fallback"
        })


class AppSettingsViewSet(viewsets.ModelViewSet):
    """
    Public app settings (policies, etc.)
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = AppSettingsSerializer
    pagination_class = None
    queryset = AppSettings.objects.all()
    lookup_field = "key"


class AdminAppSettingsViewSet(viewsets.ModelViewSet):
    """
    Admin-only app settings management
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AppSettingsSerializer
    pagination_class = None
    queryset = AppSettings.objects.all()
    lookup_field = "key"


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        Profile.objects.get_or_create(user=request.user)
        return Response(MeSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        Profile.objects.get_or_create(user=request.user)
        ser = MeSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(MeSerializer(request.user, context={"request": request}).data)


class MeAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        Profile.objects.get_or_create(user=request.user)
        p = request.user.profile
        f = request.FILES.get("file") or request.FILES.get("avatar")
        if not f:
            return Response({"file": "Required"}, status=status.HTTP_400_BAD_REQUEST)
        p.avatar_file = f
        # Clear manual avatar_url override when uploading a file
        p.avatar_url = ""
        p.save()
        return Response(MeSerializer(request.user, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def ai_generate_reply(request):
    """
    AI response generation based on ticket context.
    Uses Gemini API if available, falls back to heuristic responses.
    """
    ticket_id = request.data.get("ticket_id")
    if not ticket_id:
        return Response({"error": "ticket_id is required"}, status=400)

    try:
        ticket = Ticket.objects.prefetch_related("replies", "replies__author").get(id=ticket_id)
    except Ticket.DoesNotExist:
        return Response({"error": "Ticket not found"}, status=404)

    body = ticket.body or ""
    title = ticket.title or ""
    body_lower = body.lower()
    title_lower = title.lower()

    # Collect conversation history
    conversation_history = [f"[고객 문의] {title}\n{body}"]
    for r in ticket.replies.all().order_by("created_at"):
        author_name = getattr(r.author, "first_name", "") or "알 수 없음"
        is_staff = r.author and r.author.is_staff
        prefix = "[상담원]" if is_staff else "[고객]"
        conversation_history.append(f"{prefix} {author_name}: {r.body}")

    conversation_text = "\n\n".join(conversation_history[-10:])
    customer_name = ticket.user.first_name or "고객"

    # Try Gemini API
    if getattr(settings, "GEMINI_API_KEY", ""):
        system_prompt = """당신은 '주디(Joody)'라는 게임 고객센터의 전문 상담원입니다.
친절하고 공감하는 어조로 답변하세요. 한국어 존댓말을 사용하세요.
확인이 필요한 사항은 확인 후 안내드리겠다고 말하세요."""

        user_prompt = f"""고객명: {customer_name}
문의 제목: {title}

--- 대화 내역 ---
{conversation_text}
--- 끝 ---

위 대화를 바탕으로 자연스럽고 도움이 되는 답변을 작성해주세요."""

        ai_reply = call_gemini_api(user_prompt, system_prompt)
        if ai_reply and ai_reply.strip():
            return Response({"reply": ai_reply.strip(), "source": "gemini"})

    # Fallback heuristic responses
    if "결제" in body_lower or "환불" in body_lower or "결제" in title_lower:
        reply = "안녕하세요, 주디 고객센터입니다. 결제 관련하여 불편을 드려 죄송합니다. 요청하신 결제 내역을 확인 중에 있으며, 내부 규정에 따라 환불 가능 여부를 검토 후 안내드리겠습니다."
    elif "계정" in body_lower or "로그인" in body_lower or "계정" in title_lower:
        reply = "안녕하세요! 계정 관련 문의를 주셨군요. 현재 안내해주신 UUID와 이메일을 바탕으로 계정 상태를 확인하고 있습니다."
    elif "오류" in body_lower or "버그" in body_lower or "안돼" in body_lower:
        reply = "불편을 드려 정말 죄송합니다. 말씀해주신 현상은 담당 부서에 전달하여 원인을 파악하고 있습니다."
    else:
        reply = f"안녕하세요, {customer_name}님! 문의해주신 '{title}' 건에 대해 담당자가 확인 중에 있습니다."

    return Response({"reply": reply, "source": "heuristic"})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    ser = RegisterSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user, token = ser.save()
    return Response(
        {"token": token.key, "user": MeSerializer(user, context={"request": request}).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login(request):
    ser = LoginSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user, token = ser.save()
    return Response({"token": token.key, "user": MeSerializer(user, context={"request": request}).data})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def test_login(request):
    """
    Dev-friendly test account creation + login.
    Creates a new user each time and returns an auth token.
    """
    # Generate unique email/username
    game_uuid = str(_uuid.uuid4())
    member_code = (request.data.get("member_code") or "").strip()
    if not member_code:
        member_code = f"JD{_random.randint(100000, 999999)}"
    email = f"test+{game_uuid[:8]}@joody.local"
    password = (request.data.get("password") or "").strip() or "test1234!"
    nickname = (request.data.get("nickname") or "").strip() or f"test{_random.randint(1000, 9999)}"

    # Create user
    user = User.objects.create_user(username=email, email=email, password=password, first_name=nickname)
    Profile.objects.get_or_create(
        user=user,
        defaults={
            "display_name": nickname,
            "game_uuid": game_uuid,
            "member_code": member_code,
            "login_provider": "test",
            "login_info": {"provider": "test", "linked": True},
            "payment_info": {"has_payment_method": False, "last_purchase_at": None},
            "phone_number": "",
        },
    )

    # Token login
    from rest_framework.authtoken.models import Token

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "user": MeSerializer(user, context={"request": request}).data,
            "credentials": {"email": email, "password": password},
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def admin_test_login(request):
    """
    Dev-only: create/login a staff admin user and return a token.
    This allows using the admin UI without pre-creating an account.
    """
    if not getattr(settings, "DEBUG", False):
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    email = (request.data.get("email") or "").strip().lower() or "admin@joody.local"
    password = (request.data.get("password") or "").strip() or "admin1234!"
    nickname = (request.data.get("nickname") or "").strip() or "Admin"

    # Create or promote user to staff
    user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.create_user(username=email, email=email, password=password, first_name=nickname)
    else:
        # ensure password matches for test convenience
        try:
            user.set_password(password)
        except Exception:
            pass
    if not user.is_staff:
        user.is_staff = True
    if not user.is_superuser and (request.data.get("make_superuser") in ["1", "true", True]):
        user.is_superuser = True
    user.save()

    Profile.objects.get_or_create(user=user, defaults={"display_name": nickname})

    from rest_framework.authtoken.models import Token

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "user": MeSerializer(user, context={"request": request}).data,
            "credentials": {"email": email, "password": password},
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_analytics(request):
    """
    Admin analytics endpoint for ticket and FAQ statistics.
    Query params:
      - start_date: YYYY-MM-DD (default: 30 days ago)
      - end_date: YYYY-MM-DD (default: today)
    """
    from django.db.models import Avg, Count
    from django.db.models.functions import TruncDate
    from datetime import datetime, timedelta

    # Parse date range
    end_date_str = request.query_params.get("end_date")
    start_date_str = request.query_params.get("start_date")

    try:
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date() if end_date_str else timezone.now().date()
    except ValueError:
        end_date = timezone.now().date()

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else (end_date - timedelta(days=30))
    except ValueError:
        start_date = end_date - timedelta(days=30)

    # Ticket statistics
    tickets = Ticket.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
    total_tickets = tickets.count()
    pending_tickets = tickets.filter(status="PENDING").count()
    answered_tickets = tickets.filter(status="ANSWERED").count()
    closed_tickets = tickets.filter(status="CLOSED").count()
    unassigned_tickets = tickets.filter(assignee__isnull=True).count()

    # Average response time (first staff reply)
    response_times = []
    for ticket in tickets.prefetch_related("replies"):
        first_staff_reply = ticket.replies.filter(
            author__is_staff=True
        ).order_by("created_at").first()
        if first_staff_reply:
            diff = (first_staff_reply.created_at - ticket.created_at).total_seconds() / 60  # minutes
            response_times.append(diff)

    avg_response_time_min = round(sum(response_times) / len(response_times)) if response_times else 0

    # Average processing time (from creation to close)
    processing_times = []
    for ticket in tickets.filter(status="CLOSED"):
        diff = (ticket.updated_at - ticket.created_at).total_seconds() / 60  # minutes
        processing_times.append(diff)

    avg_processing_time_min = round(sum(processing_times) / len(processing_times)) if processing_times else 0

    # FAQ analytics
    faq_views = FAQView.objects.filter(viewed_at__date__gte=start_date, viewed_at__date__lte=end_date)
    total_faq_views = faq_views.count()

    # Top viewed FAQs
    top_faqs = FAQ.objects.filter(
        views__viewed_at__date__gte=start_date,
        views__viewed_at__date__lte=end_date
    ).annotate(
        period_views=Count("views")
    ).order_by("-period_views")[:10]

    top_faqs_data = [
        {
            "id": faq.id,
            "title": faq.title,
            "category": faq.category.name if faq.category else None,
            "views": faq.period_views,
            "total_views": faq.view_count,
        }
        for faq in top_faqs
    ]

    # Daily ticket trend
    daily_tickets = tickets.annotate(
        date=TruncDate("created_at")
    ).values("date").annotate(
        count=Count("id")
    ).order_by("date")

    daily_tickets_data = [
        {"date": str(item["date"]), "count": item["count"]}
        for item in daily_tickets
    ]

    # Daily FAQ views trend
    daily_faq_views = faq_views.annotate(
        date=TruncDate("viewed_at")
    ).values("date").annotate(
        count=Count("id")
    ).order_by("date")

    daily_faq_views_data = [
        {"date": str(item["date"]), "count": item["count"]}
        for item in daily_faq_views
    ]

    return Response({
        "date_range": {
            "start_date": str(start_date),
            "end_date": str(end_date),
        },
        "tickets": {
            "total": total_tickets,
            "pending": pending_tickets,
            "answered": answered_tickets,
            "closed": closed_tickets,
            "unassigned": unassigned_tickets,
            "avg_response_time_min": avg_response_time_min,
            "avg_processing_time_min": avg_processing_time_min,
            "resolution_rate": round((closed_tickets / total_tickets) * 100) if total_tickets > 0 else 0,
        },
        "faq": {
            "total_views": total_faq_views,
            "top_faqs": top_faqs_data,
        },
        "trends": {
            "daily_tickets": daily_tickets_data,
            "daily_faq_views": daily_faq_views_data,
        }
    })


# ---------------------------------------------------------------------------
# VOC (Voice of Customer) Auto-collection & Studio
# ---------------------------------------------------------------------------

_VOC_TAG_MAP = {
    "버그": "BUG",
    "bug": "BUG",
    "건의": "SUGGESTION",
    "건의사항": "SUGGESTION",
    "suggestion": "SUGGESTION",
    "feature": "SUGGESTION",
    "불만": "COMPLAINT",
    "complaint": "COMPLAINT",
    "칭찬": "PRAISE",
    "praise": "PRAISE",
}


def _auto_create_voc(ticket, added_tags: set, user):
    """태그 추가 시 VOC 엔트리 자동 생성 (중복 방지: 티켓당 타입별 1개)."""
    for tag_lower in added_tags:
        voc_type = _VOC_TAG_MAP.get(tag_lower)
        if not voc_type:
            continue
        if VocEntry.objects.filter(ticket=ticket, voc_type=voc_type).exists():
            continue
        VocEntry.objects.create(
            ticket=ticket,
            voc_type=voc_type,
            created_by=user,
            summary=f"[{ticket.title}] {(ticket.body or '')[:200]}",
            severity="HIGH" if voc_type == "BUG" else "MEDIUM",
        )


class AdminVocViewSet(viewsets.ModelViewSet):
    """VOC Studio — 고객 의견 수집·분석·관리"""
    serializer_class = VocEntrySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        qs = VocEntry.objects.select_related("ticket", "ticket__user", "created_by").all()
        voc_type = self.request.query_params.get("voc_type")
        status_filter = self.request.query_params.get("status")
        severity = self.request.query_params.get("severity")
        q = self.request.query_params.get("q")
        if voc_type:
            qs = qs.filter(voc_type=voc_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if severity:
            qs = qs.filter(severity=severity)
        if q:
            qs = qs.filter(Q(summary__icontains=q) | Q(ticket__title__icontains=q) | Q(keywords__icontains=q))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def analyze(self, request, pk=None):
        """AI로 VOC 분석 — 요약, 키워드, 감성, 카테고리, 영향도, 액션아이템 추출"""
        entry: VocEntry = self.get_object()
        ticket = entry.ticket

        conversation = [f"제목: {ticket.title}\n내용: {ticket.body or ''}"]
        for r in ticket.replies.all().order_by("created_at")[:20]:
            prefix = "[상담원]" if r.author and r.author.is_staff else "[고객]"
            conversation.append(f"{prefix} {r.body}")
        conv_text = "\n\n".join(conversation)

        system_prompt = """당신은 VOC(고객의 소리) 분석 전문가입니다.
고객 문의 대화를 분석하여 아래 JSON 형식으로 정확히 응답하세요:
{
  "summary": "핵심 내용 2-3문장 요약",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "sentiment": "positive|negative|neutral|mixed",
  "sentiment_score": -1.0~1.0 사이의 숫자,
  "category": "결제|계정|게임플레이|UI/UX|성능|보안|기타 중 하나",
  "impact_score": 1~10 (비즈니스 영향도),
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "action_items": ["구체적 개선/조치 사항 1", "구체적 개선/조치 사항 2"],
  "root_cause": "근본 원인 분석 1-2문장",
  "user_emotion": "분노|실망|혼란|만족|감사|무관심 중 하나"
}
반드시 유효한 JSON만 응답하세요."""

        user_prompt = f"""VOC 유형: {entry.get_voc_type_display()}

--- 전체 대화 ---
{conv_text}
--- 끝 ---

위 대화를 분석하여 JSON으로 응답하세요."""

        ai_result = None
        source = "fallback"

        if getattr(settings, "OPENROUTER_API_KEY", ""):
            raw = call_openrouter_api(user_prompt, system_prompt)
            if raw and raw.strip():
                ai_result = raw.strip()
                source = "openrouter"

        if not ai_result and getattr(settings, "GEMINI_API_KEY", ""):
            raw = call_gemini_api(user_prompt, system_prompt)
            if raw and raw.strip():
                ai_result = raw.strip()
                source = "gemini"

        if ai_result:
            try:
                cleaned = ai_result
                if "```json" in cleaned:
                    cleaned = cleaned.split("```json")[1].split("```")[0].strip()
                elif "```" in cleaned:
                    cleaned = cleaned.split("```")[1].split("```")[0].strip()
                parsed = _json.loads(cleaned)

                entry.summary = parsed.get("summary", entry.summary)
                entry.keywords = parsed.get("keywords", [])[:10]
                entry.sentiment = parsed.get("sentiment", "")
                entry.sentiment_score = float(parsed.get("sentiment_score", 0))
                entry.category = parsed.get("category", "")
                entry.impact_score = max(1, min(10, int(parsed.get("impact_score", 5))))
                entry.severity = parsed.get("severity", entry.severity)
                entry.action_items = parsed.get("action_items", [])
                entry.ai_analysis = parsed
                entry.save()
                return Response({"success": True, "analysis": parsed, "source": source})
            except Exception as e:
                logger.warning(f"VOC AI parse error: {e}")
                return Response({"success": False, "raw": ai_result, "source": source})

        # Fallback: 기본 분석
        entry.summary = entry.summary or f"{ticket.title}: {(ticket.body or '')[:150]}"
        entry.keywords = [w for w in (ticket.title or "").split()[:5] if len(w) > 1]
        entry.save()
        return Response({"success": True, "analysis": {"summary": entry.summary, "keywords": entry.keywords}, "source": "fallback"})

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        """VOC 대시보드 통계"""
        from django.db.models import Avg, Count
        from django.db.models.functions import TruncDate
        from datetime import timedelta

        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)
        qs = VocEntry.objects.filter(created_at__gte=since)

        total = qs.count()
        by_type = dict(qs.values_list("voc_type").annotate(c=Count("id")).values_list("voc_type", "c"))
        by_status = dict(qs.values_list("status").annotate(c=Count("id")).values_list("status", "c"))
        by_severity = dict(qs.values_list("severity").annotate(c=Count("id")).values_list("severity", "c"))
        avg_impact = qs.aggregate(avg=Avg("impact_score"))["avg"] or 0
        avg_sentiment = qs.exclude(sentiment_score=0).aggregate(avg=Avg("sentiment_score"))["avg"] or 0

        # 감성 분포
        sentiment_dist = dict(qs.exclude(sentiment="").values_list("sentiment").annotate(c=Count("id")).values_list("sentiment", "c"))

        # 일별 추이
        daily = list(
            qs.annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )
        daily_data = [{"date": str(d["date"]), "count": d["count"]} for d in daily]

        # 상위 키워드 (모든 엔트리에서 추출)
        kw_counts: dict = {}
        for keywords in qs.exclude(keywords=[]).values_list("keywords", flat=True):
            for kw in (keywords or []):
                kw_str = str(kw).strip()
                if kw_str:
                    kw_counts[kw_str] = kw_counts.get(kw_str, 0) + 1
        top_keywords = sorted(kw_counts.items(), key=lambda x: -x[1])[:20]

        # 상위 카테고리
        cat_counts = dict(
            qs.exclude(category="").values_list("category").annotate(c=Count("id")).order_by("-c").values_list("category", "c")[:10]
        )

        return Response({
            "total": total,
            "by_type": by_type,
            "by_status": by_status,
            "by_severity": by_severity,
            "avg_impact": round(avg_impact, 1),
            "avg_sentiment": round(avg_sentiment, 2),
            "sentiment_dist": sentiment_dist,
            "daily_trend": daily_data,
            "top_keywords": [{"keyword": k, "count": c} for k, c in top_keywords],
            "top_categories": cat_counts,
            "days": days,
        })

