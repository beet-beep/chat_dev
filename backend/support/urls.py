from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminAgentViewSet,
  AdminTicketCategoryViewSet,
    AdminTicketTagViewSet,
    AdminFAQCategoryViewSet,
    AdminFAQViewSet,
    # AdminInboxViewViewSet,
    # AdminSupportChannelViewSet,
    # AdminSupportTagViewSet,
    # AdminSupportTeamViewSet,
    AdminTicketViewSet,
    AdminCustomerViewSet,
    AdminAiLibraryItemViewSet,
    AdminVocViewSet,
    FAQCategoryViewSet,
    FAQViewSet,
    MeView,
    MeAvatarView,
    TicketAttachmentFileView,
    TicketCategoryViewSet,
    TicketViewSet,
    login,
    register,
    test_login,
    ai_generate_reply,
    admin_test_login,
    admin_analytics,
    admin_translate,
    AppSettingsViewSet,
    AdminAppSettingsViewSet,
)

router = DefaultRouter()
router.register(r"faq-categories", FAQCategoryViewSet, basename="faq-category")
router.register(r"faqs", FAQViewSet, basename="faq")
router.register(r"ticket-categories", TicketCategoryViewSet, basename="ticket-category")
router.register(r"tickets", TicketViewSet, basename="ticket")
router.register(r"settings", AppSettingsViewSet, basename="settings")
router.register(r"admin/tickets", AdminTicketViewSet, basename="admin-ticket")
router.register(r"admin/ticket-categories", AdminTicketCategoryViewSet, basename="admin-ticket-category")
router.register(r"admin/ticket-tags", AdminTicketTagViewSet, basename="admin-ticket-tag")
router.register(r"admin/agents", AdminAgentViewSet, basename="admin-agent")
# router.register(r"admin/inbox-views", AdminInboxViewViewSet, basename="admin-inbox-view")
# router.register(r"admin/presets/tags", AdminSupportTagViewSet, basename="admin-support-tag")
# router.register(r"admin/presets/channels", AdminSupportChannelViewSet, basename="admin-support-channel")
# router.register(r"admin/presets/teams", AdminSupportTeamViewSet, basename="admin-support-team")
router.register(r"admin/faq-categories", AdminFAQCategoryViewSet, basename="admin-faq-category")
router.register(r"admin/faqs", AdminFAQViewSet, basename="admin-faq")
router.register(r"admin/customers", AdminCustomerViewSet, basename="admin-customer")
router.register(r"admin/ai-library", AdminAiLibraryItemViewSet, basename="admin-ai-library")
router.register(r"admin/voc", AdminVocViewSet, basename="admin-voc")
router.register(r"admin/settings", AdminAppSettingsViewSet, basename="admin-settings")

urlpatterns = [
    path("auth/register/", register),
    path("auth/login/", login),
    path("auth/test-login/", test_login),
    path("auth/admin-test-login/", admin_test_login),
    path("admin/ai-generate-reply/", ai_generate_reply),
    path("admin/analytics/", admin_analytics),
    path("admin/translate/", admin_translate),
    path("admin/me/", MeView.as_view()),
    path("admin/me/avatar/", MeAvatarView.as_view()),
    path("me/", MeView.as_view()),
    path("me/avatar/", MeAvatarView.as_view()),
    path("attachments/<uuid:public_id>/", TicketAttachmentFileView.as_view(), name="support-ticket-attachment"),
]

urlpatterns += router.urls


