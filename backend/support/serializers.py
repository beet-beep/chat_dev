from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from django.urls import reverse

from .models import (
    FAQ,
    FAQAttachment,
    FAQCategory,
    Profile,
    Ticket,
    TicketAttachment,
    TicketCategory,
    TicketReply,
    TicketNote,
    TicketTag,
    TicketTagAssignment,
    SupportTeam,
    AiLibraryItem,
    ChatTemplate,
    AppSettings,
    VocEntry,
)

User = get_user_model()

def _abs_url(request, url: str) -> str:
    """Return URL - keep relative for dev proxy compatibility."""
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    # Keep relative URLs as-is for Vite proxy (/media -> backend)
    if url.startswith("/"):
        return url
    # Prepend slash for relative paths (e.g., "media/..." -> "/media/...")
    return f"/{url}"


def _profile_avatar_url(request, p: Profile) -> str:
    try:
        if getattr(p, "avatar_file", None):
            return _abs_url(request, p.avatar_file.url)
    except Exception:
        pass
    return _abs_url(request, getattr(p, "avatar_url", "") or "")


class FAQCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQCategory
        fields = ["id", "name", "name_i18n", "order", "guide_url", "kind", "is_guide_link"]


class FAQAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = FAQAttachment
        fields = ["id", "url", "original_name", "content_type", "created_at"]

    def get_url(self, obj: FAQAttachment) -> str:
        request = self.context.get("request")
        url = obj.file.url
        if request is not None:
            url = request.build_absolute_uri(url)
        return url


class FAQSerializer(serializers.ModelSerializer):
    category = FAQCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=FAQCategory.objects.all(), write_only=True, required=False, allow_null=True
    )
    attachments = FAQAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = FAQ
        fields = [
            "id",
            "category",
            "category_id",
            "title",
            "title_i18n",
            "body",
            "body_i18n",
            "blocks",
            "attachments",
            "is_popular",
            "is_hidden",
            "order",
            "lang",
            "created_at",
        ]


class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = [
            "id",
            "name",
            "name_i18n",
            "order",
            "guide_description",
            "guide_description_i18n",
            "bot_enabled",
            "bot_title",
            "bot_title_i18n",
            "bot_blocks",
            "bot_blocks_i18n",
            "form_enabled",
            "form_button_label",
            "form_button_label_i18n",
            "form_template",
            "form_template_i18n",
            "form_title_template",
            "form_title_template_i18n",
            "form_checklist",
            "form_checklist_i18n",
            "form_checklist_required",
        ]


class TicketReplySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()
    author_is_staff = serializers.SerializerMethodField()

    class Meta:
        model = TicketReply
        fields = ["id", "body", "author_name", "author", "author_is_staff", "created_at", "attachments", "is_internal"]

    def get_author_name(self, obj: TicketReply) -> str:
        if not obj.author:
            return "운영자"
        return obj.author.get_full_name() or getattr(obj.author, "email", "") or obj.author.get_username()

    def get_author_is_staff(self, obj: TicketReply) -> bool:
        if not obj.author:
            return True
        return bool(getattr(obj.author, "is_staff", False))

    def get_author(self, obj: TicketReply):
        """
        ChannelTalk-like UI needs author identity.
        For legacy staff replies where author is null, return a synthetic '운영자' author.
        """
        request = self.context.get("request")
        if not obj.author:
            return {"id": None, "name": "운영자", "avatar_url": "", "is_staff": True}
        u = obj.author
        Profile.objects.get_or_create(user=u)
        p = u.profile
        name = (p.display_name or u.get_full_name() or getattr(u, "email", "") or u.get_username()).strip() or "사용자"
        avatar = _profile_avatar_url(request, p)
        return {"id": u.id, "name": name, "avatar_url": avatar, "is_staff": bool(getattr(u, "is_staff", False))}

    def get_attachments(self, obj: TicketReply):
        request = self.context.get("request")
        out = []
        for a in obj.attachments.all():
            url = reverse("support-ticket-attachment", kwargs={"public_id": a.public_id})
            if request is not None:
                url = request.build_absolute_uri(url)
            out.append(
                {
                    "id": a.id,
                    "url": url,
                    "original_name": a.original_name,
                    "content_type": a.content_type,
                }
            )
        return out


class TicketSerializer(serializers.ModelSerializer):
    category = TicketCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=TicketCategory.objects.all(), write_only=True, required=False, allow_null=True
    )
    replies = TicketReplySerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    attachments = serializers.SerializerMethodField()
    tags = serializers.JSONField(required=False, default=list)
    priority = serializers.CharField(required=False, default="NORMAL")
    channel = serializers.CharField(required=False, default="inapp")
    team = serializers.CharField(required=False, allow_blank=True, default="")
    assignee_id = serializers.IntegerField(read_only=True)
    entry_source = serializers.CharField(required=False, allow_blank=True)
    user_device = serializers.CharField(required=False, allow_blank=True, default="")
    user_locale = serializers.CharField(required=False, allow_blank=True, default="")
    user_location = serializers.CharField(required=False, allow_blank=True, default="")
    client_meta = serializers.JSONField(required=False, default=dict)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "category",
            "category_id",
            "title",
            "body",
            "status",
            "status_label",
            "created_at",
            "replies",
            "attachments",
            "assignee_id",
            "priority",
            "tags",
            "channel",
            "team",
            "entry_source",
            "user_device",
            "user_locale",
            "user_location",
            "client_meta",
        ]
        read_only_fields = ["status"]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["user"] = request.user
        # Defensive defaults: avoid accidentally inserting NULL into NOT NULL columns
        if validated_data.get("team") is None:
            validated_data["team"] = ""
        if validated_data.get("priority") is None:
            validated_data["priority"] = "NORMAL"
        if validated_data.get("channel") is None:
            validated_data["channel"] = "inapp"
        if validated_data.get("tags") is None:
            validated_data["tags"] = []
        return super().create(validated_data)

    def get_attachments(self, obj: Ticket):
        request = self.context.get("request")
        out = []
        for a in obj.attachments.all():
            url = reverse("support-ticket-attachment", kwargs={"public_id": a.public_id})
            if request is not None:
                url = request.build_absolute_uri(url)
            out.append(
                {
                    "id": a.id,
                    "url": url,
                    "original_name": a.original_name,
                    "content_type": a.content_type,
                }
            )
        return out


class VocEntrySerializer(serializers.ModelSerializer):
    ticket_title = serializers.CharField(source="ticket.title", read_only=True)
    ticket_status = serializers.CharField(source="ticket.status", read_only=True)
    user_name = serializers.SerializerMethodField()
    voc_type_label = serializers.CharField(source="get_voc_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    severity_label = serializers.CharField(source="get_severity_display", read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VocEntry
        fields = [
            "id", "ticket", "ticket_title", "ticket_status",
            "voc_type", "voc_type_label",
            "status", "status_label",
            "severity", "severity_label",
            "summary", "keywords", "sentiment", "sentiment_score",
            "category", "impact_score", "ai_analysis", "action_items",
            "admin_note", "user_name",
            "created_by", "created_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def get_user_name(self, obj):
        try:
            return obj.ticket.user.get_full_name() or obj.ticket.user.username
        except Exception:
            return ""

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ""
        return obj.created_by.get_full_name() or obj.created_by.username


class AdminTicketSerializer(TicketSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(read_only=True)
    user_uuid = serializers.CharField(source="user.username", read_only=True)
    user_avatar_url = serializers.SerializerMethodField()
    user_seen_at = serializers.DateTimeField(read_only=True)
    staff_seen_at = serializers.DateTimeField(read_only=True)
    reopened_at = serializers.DateTimeField(read_only=True)
    user_has_seen_latest_staff = serializers.SerializerMethodField()

    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + [
            "user_email",
            "user_name",
            "user_id",
            "user_uuid",
            "user_avatar_url",
            "user_seen_at",
            "staff_seen_at",
            "reopened_at",
            "user_has_seen_latest_staff",
        ]

    def get_user_name(self, obj: Ticket) -> str:
        try:
            Profile.objects.get_or_create(user=obj.user)
            p = obj.user.profile
            return (p.display_name or obj.user.get_full_name() or obj.user.first_name or obj.user.get_username()).strip()
        except Exception:
            return (getattr(obj.user, "get_username", lambda: "")() or "").strip()

    def get_user_avatar_url(self, obj: Ticket) -> str:
        request = self.context.get("request")
        try:
            Profile.objects.get_or_create(user=obj.user)
            return _profile_avatar_url(request, obj.user.profile)
        except Exception:
            return ""

    def get_user_has_seen_latest_staff(self, obj: Ticket) -> bool:
        """
        관리자 UI에서만 사용: '운영자(스태프) 마지막 메시지'를 유저가 확인했는지 여부.
        """
        seen_at = obj.user_seen_at
        if not seen_at:
            return False
        last_staff = None
        try:
            last_staff = (
                obj.replies.filter(author__is_staff=True).order_by("-created_at").values_list("created_at", flat=True).first()
            )
        except Exception:
            last_staff = None
        if not last_staff:
            return False
        return seen_at >= last_staff


class TicketNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketNote
        fields = ["id", "body", "author_name", "created_at"]

    def get_author_name(self, obj: TicketNote) -> str:
        if not obj.author:
            return "운영자"
        return obj.author.get_full_name() or getattr(obj.author, "email", "") or obj.author.get_username()


# class AdminInboxViewSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = AdminInboxView
#         fields = ["id", "name", "config", "scope", "created_at", "updated_at"]


# class SupportTagSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = SupportTag
#         fields = ["id", "name", "color", "order", "is_active", "created_at", "updated_at"]


class TicketTagSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketTag
        fields = ["id", "name", "color", "parent", "order", "created_at", "children"]
    
    def get_children(self, obj):
        if hasattr(obj, "children"):
            children = obj.children.all()
            return TicketTagSerializer(children, many=True).data
        return []


# class SupportChannelSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = SupportChannel
#         fields = ["id", "key", "label", "order", "is_active", "created_at", "updated_at"]


class SupportTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTeam
        fields = ["id", "key", "label", "order", "is_active", "created_at", "updated_at"]


class AiLibraryItemSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AiLibraryItem
        fields = [
            "id",
            "ticket",
            "title",
            "context",
            "generated_reply",
            "final_reply",
            "tags",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ""
        return obj.created_by.get_full_name() or obj.created_by.username


class AppSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppSettings
        fields = ["key", "value", "description", "updated_at"]
        read_only_fields = ["updated_at"]

    def get_created_by_name(self, obj: AiLibraryItem) -> str:
        try:
            u = obj.created_by
            Profile.objects.get_or_create(user=u)
            p = u.profile
            return (p.display_name or u.get_full_name() or getattr(u, "email", "") or u.get_username()).strip() or "운영자"
        except Exception:
            return "운영자"


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "display_name",
            "avatar_url",
            "status_message",
            "job_title",
            "phone_number",
            "game_uuid",
            "member_code",
            "login_provider",
            "payment_info",
            "login_info",
            "is_vip",
            "tags",
            "notes",
        ]

    def to_representation(self, instance: Profile):
        rep = super().to_representation(instance)
        request = self.context.get("request")
        # Always compute avatar_url from uploaded file first (absolute URL)
        rep["avatar_url"] = _profile_avatar_url(request, instance)
        # Hide admin-only fields from non-admin users, but keep user's own account/payment summary visible.
        if request and not getattr(getattr(request, "user", None), "is_staff", False):
            # Never show CS/internal tagging to end-users
            for k in ["is_vip", "tags", "notes"]:
                rep.pop(k, None)
            # Strip admin-only spend tracking keys from payment_info (keep other keys like has_payment_method).
            pi = rep.get("payment_info")
            if isinstance(pi, dict):
                for k in ["total_spend_krw", "seen_purchase_tx_ids"]:
                    pi.pop(k, None)
                rep["payment_info"] = pi
        return rep


class MeSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "is_staff", "is_superuser", "profile"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if profile_data is not None:
            profile, _ = Profile.objects.get_or_create(user=instance)
            # If user explicitly sets avatar_url, treat it as a manual override and clear uploaded avatar_file.
            if "avatar_url" in profile_data:
                try:
                    profile.avatar_file = None
                except Exception:
                    pass
            for k, v in profile_data.items():
                setattr(profile, k, v)
            profile.save()

        return instance


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    name = serializers.CharField(max_length=80, required=False, allow_blank=True)

    def create(self, validated_data):
        email = validated_data["email"].lower()
        password = validated_data["password"]
        name = validated_data.get("name", "").strip()

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "이미 가입된 이메일입니다."})

        username = email
        user = User.objects.create_user(username=username, email=email, password=password, first_name=name)
        Profile.objects.get_or_create(user=user, defaults={"display_name": name})
        token, _ = Token.objects.get_or_create(user=user)
        return user, token


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower()
        password = attrs["password"]
        # Our default creates username=email
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("이메일 또는 비밀번호가 올바르지 않습니다.")
        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return user, token


class TicketReplyCreateSerializer(serializers.Serializer):
    body = serializers.CharField(allow_blank=True, default="")


