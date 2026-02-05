from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def _upload_to_ticket(instance, filename: str) -> str:
    return f"tickets/{instance.ticket_id}/{filename}"


def _upload_to_reply(instance, filename: str) -> str:
    return f"ticket_replies/{instance.reply_id}/{filename}"


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TicketAttachment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("file", models.FileField(upload_to=_upload_to_ticket)),
                ("original_name", models.CharField(blank=True, default="", max_length=255)),
                ("content_type", models.CharField(blank=True, default="", max_length=120)),
                (
                    "ticket",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attachments", to="support.ticket"),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ticket_attachments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="TicketReplyAttachment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("file", models.FileField(upload_to=_upload_to_reply)),
                ("original_name", models.CharField(blank=True, default="", max_length=255)),
                ("content_type", models.CharField(blank=True, default="", max_length=120)),
                (
                    "reply",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attachments", to="support.ticketreply"),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ticket_reply_attachments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]







