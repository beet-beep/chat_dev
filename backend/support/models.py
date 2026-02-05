from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


def _upload_to_faq(instance, filename: str) -> str:
    return f"faqs/{instance.faq_id}/{filename}"


def _upload_to_avatar(instance, filename: str) -> str:
    return f"avatars/{instance.user_id}/{filename}"


def _upload_to_ticket(instance, filename: str) -> str:
    return f"tickets/{instance.ticket_id}/{filename}"


def _upload_to_reply(instance, filename: str) -> str:
    return f"replies/{instance.reply_id}/{filename}"


class TicketCategory(models.Model):
    PLATFORM_CHOICES = [
        ("ALL", "전체"),
        ("ANDROID", "안드로이드"),
        ("IOS", "iOS"),
    ]
    
    name = models.CharField(max_length=200)
    name_i18n = models.JSONField(default=dict, blank=True, help_text='{"en":"...","ja":"...","zh-TW":"..."}')
    order = models.IntegerField(default=0)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default="ALL")
    guide_description = models.TextField(blank=True, default="아래 안내를 확인하고 문의를 접수하면 더 빠르게 도와드릴 수 있어요.")
    guide_description_i18n = models.JSONField(default=dict, blank=True, help_text='{"en":"...","ja":"...","zh-TW":"..."}')
    bot_enabled = models.BooleanField(default=False)
    bot_title = models.CharField(max_length=200, blank=True, default="주디 서포트봇")
    bot_title_i18n = models.JSONField(default=dict, blank=True)
    bot_blocks = models.JSONField(default=list, blank=True)
    bot_blocks_i18n = models.JSONField(default=dict, blank=True, help_text='{"en":[...],"ja":[...],"zh-TW":[...]}')
    form_enabled = models.BooleanField(default=False)
    form_button_label = models.CharField(max_length=100, blank=True, default="기본 양식 넣기")
    form_button_label_i18n = models.JSONField(default=dict, blank=True)
    form_template = models.TextField(blank=True)
    form_template_i18n = models.JSONField(default=dict, blank=True)
    form_title_template = models.CharField(max_length=500, blank=True)
    form_title_template_i18n = models.JSONField(default=dict, blank=True)
    form_checklist = models.JSONField(default=list, blank=True)
    form_checklist_i18n = models.JSONField(default=dict, blank=True, help_text='{"en":[...],"ja":[...],"zh-TW":[...]}')
    form_checklist_required = models.BooleanField(default=False)
    form_default_content = models.TextField(blank=True, default="")

    class Meta:
        verbose_name_plural = "Ticket categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Ticket(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "진행중"),
        ("ANSWERED", "보류"),
        ("CLOSED", "완료"),
    ]
    PRIORITY_CHOICES = [
        ("LOW", "낮음"),
        ("NORMAL", "보통"),
        ("HIGH", "높음"),
        ("URGENT", "긴급"),
    ]

    # NOTE: DB schema follows migrations: Ticket belongs to an auth User (FK), and stores metadata fields.
    category = models.ForeignKey(TicketCategory, null=True, blank=True, on_delete=models.SET_NULL, related_name="tickets")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tickets")
    title = models.CharField(max_length=200)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="NORMAL", blank=True)
    assignee = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_tickets")
    tags = models.JSONField(default=list, blank=True)
    channel = models.CharField(max_length=40, blank=True, default="")
    staff_seen_at = models.DateTimeField(null=True, blank=True)
    user_seen_at = models.DateTimeField(null=True, blank=True)
    entry_source = models.CharField(max_length=40, blank=True, default="")
    team = models.CharField(max_length=40, blank=True, default="")
    user_device = models.CharField(max_length=200, blank=True, default="")
    user_locale = models.CharField(max_length=40, blank=True, default="")
    user_location = models.CharField(max_length=80, blank=True, default="")
    client_meta = models.JSONField(default=dict, blank=True)
    reopened_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.id} {self.title or self.body[:50]}"


class TicketReply(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="replies")
    author = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    body = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Ticket replies"
        ordering = ["created_at"]

    def __str__(self):
        return f"Reply to #{self.ticket_id}"


class TicketAttachment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="attachments")
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="ticket_attachments")
    file = models.FileField(upload_to=_upload_to_ticket)
    original_name = models.CharField(max_length=255, blank=True, default="")
    content_type = models.CharField(max_length=120, blank=True, default="")
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.original_name or str(self.public_id)


class TicketReplyAttachment(models.Model):
    reply = models.ForeignKey(TicketReply, on_delete=models.CASCADE, related_name="attachments")
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="ticket_reply_attachments")
    file = models.FileField(upload_to=_upload_to_reply)
    original_name = models.CharField(max_length=255, blank=True, default="")
    content_type = models.CharField(max_length=120, blank=True, default="")
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.original_name or str(self.public_id)


class TicketNote(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Note on #{self.ticket_id}"


class TicketTag(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default="#6B7280")
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]
        unique_together = [["name", "parent"]]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name


class TicketTagAssignment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="tag_assignments")
    tag = models.ForeignKey(TicketTag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("ticket", "tag")


class FAQCategory(models.Model):
    KIND_CHOICES = [
        ("GENERAL", "일반"),
        ("GUIDE", "가이드"),
    ]
    name = models.CharField(max_length=200)
    name_i18n = models.JSONField(default=dict, blank=True, help_text='{"en":"...","ja":"...","zh-TW":"..."}')
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default="GENERAL")
    is_guide_link = models.BooleanField(default=False)
    guide_url = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "FAQ categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class FAQ(models.Model):
    LANG_CHOICES = [("ko", "한국어"), ("en", "English"), ("ja", "日本語"), ("zh-TW", "繁體中文")]

    category = models.ForeignKey(FAQCategory, null=True, blank=True, on_delete=models.SET_NULL, related_name="faqs")
    title = models.CharField(max_length=500)
    title_i18n = models.JSONField(default=dict, blank=True, help_text='{"en":"...","ja":"...","zh-TW":"..."}')
    body = models.TextField(blank=True)
    body_i18n = models.JSONField(default=dict, blank=True, help_text='{"en":"...","ja":"...","zh-TW":"..."}')
    blocks = models.JSONField(default=list, blank=True)
    is_popular = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    lang = models.CharField(max_length=10, choices=LANG_CHOICES, default="ko", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title


class FAQView(models.Model):
    """Track individual FAQ views for analytics."""
    faq = models.ForeignKey(FAQ, on_delete=models.CASCADE, related_name="views")
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="faq_views")
    session_id = models.CharField(max_length=64, blank=True, default="")
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-viewed_at"]


class FAQAttachment(models.Model):
    faq = models.ForeignKey(FAQ, on_delete=models.CASCADE, related_name="attachments")
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="faq_attachments")
    file = models.FileField(upload_to=_upload_to_faq)
    original_name = models.CharField(max_length=255, blank=True, default="")
    content_type = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.original_name or str(self.id)


class ChatTemplate(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    shortcut = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="chat_templates")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "title"]

    def __str__(self):
        return self.title


class AiLibraryItem(models.Model):
    ticket = models.ForeignKey(Ticket, null=True, blank=True, on_delete=models.SET_NULL, related_name="ai_library_items")
    title = models.CharField(max_length=200, blank=True, default="")
    context = models.TextField(blank=True, default="")
    generated_reply = models.TextField(blank=True, default="")
    final_reply = models.TextField(blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_library_items")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.title or f"Item #{self.id}"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=80, blank=True, default="")
    avatar_url = models.URLField(blank=True, default="", max_length=200)
    phone_number = models.CharField(max_length=40, blank=True, default="")
    is_vip = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, default="")
    status_message = models.CharField(max_length=140, blank=True, default="")
    job_title = models.CharField(max_length=100, blank=True, default="")
    avatar_file = models.FileField(upload_to=_upload_to_avatar, blank=True, null=True)
    game_uuid = models.CharField(max_length=64, blank=True, default="")
    member_code = models.CharField(max_length=32, blank=True, default="")
    login_provider = models.CharField(max_length=40, blank=True, default="")
    payment_info = models.JSONField(default=dict, blank=True)
    login_info = models.JSONField(default=dict, blank=True)
    # These columns exist in DB (manually backfilled) to avoid crashes; keep nullable.
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.display_name or self.user.get_username()


class SupportTeam(models.Model):
    key = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=200)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "key"]

    def __str__(self):
        return self.label


class AppSettings(models.Model):
    key = models.CharField(max_length=100, unique=True, primary_key=True)
    value = models.TextField(blank=True)
    description = models.CharField(max_length=500, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "App settings"

    def __str__(self):
        return self.key


class VocEntry(models.Model):
    VOC_TYPE_CHOICES = [
        ("BUG", "버그"),
        ("SUGGESTION", "건의사항"),
        ("COMPLAINT", "불만"),
        ("PRAISE", "칭찬"),
        ("OTHER", "기타"),
    ]
    STATUS_CHOICES = [
        ("NEW", "신규"),
        ("REVIEWING", "검토중"),
        ("PLANNED", "반영예정"),
        ("DONE", "반영완료"),
        ("REJECTED", "반려"),
    ]
    SEVERITY_CHOICES = [
        ("LOW", "낮음"),
        ("MEDIUM", "보통"),
        ("HIGH", "높음"),
        ("CRITICAL", "긴급"),
    ]

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="voc_entries")
    voc_type = models.CharField(max_length=20, choices=VOC_TYPE_CHOICES, default="OTHER", db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="NEW", db_index=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="MEDIUM")
    summary = models.TextField(blank=True)
    keywords = models.JSONField(default=list, blank=True)
    sentiment = models.CharField(max_length=20, blank=True)
    sentiment_score = models.FloatField(default=0)
    category = models.CharField(max_length=100, blank=True)
    impact_score = models.IntegerField(default=5)
    ai_analysis = models.JSONField(default=dict, blank=True)
    action_items = models.JSONField(default=list, blank=True)
    admin_note = models.TextField(blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "VOC entries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"VOC #{self.id} [{self.voc_type}] {self.summary[:50] if self.summary else ''}"
