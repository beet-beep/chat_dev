from django.contrib import admin

from .models import AiLibraryItem, FAQ, FAQCategory, Profile, Ticket, TicketCategory, TicketReply, VocEntry


@admin.register(FAQCategory)
class FAQCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "order")
    ordering = ("order", "id")


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "lang", "is_popular", "order", "created_at")
    list_filter = ("lang", "is_popular", "category")
    search_fields = ("title", "body")
    ordering = ("-is_popular", "order", "-created_at")


@admin.register(TicketCategory)
class TicketCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "order")
    ordering = ("order", "id")


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "category", "status", "created_at")
    list_filter = ("status", "category")
    search_fields = ("title", "body", "user__email", "user__username")
    ordering = ("-created_at",)


@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "author", "created_at")
    search_fields = ("body",)
    ordering = ("created_at",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "display_name")


@admin.register(AiLibraryItem)
class AiLibraryItemAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "created_by", "created_at")
    search_fields = ("title", "context", "generated_reply", "final_reply")
    ordering = ("-created_at", "-id")


@admin.register(VocEntry)
class VocEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "voc_type", "status", "severity", "category", "impact_score", "created_at")
    list_filter = ("voc_type", "status", "severity", "category")
    search_fields = ("summary", "keywords")
    ordering = ("-created_at",)



