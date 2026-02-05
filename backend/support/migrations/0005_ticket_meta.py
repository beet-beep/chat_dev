from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0004_customer_db"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="assignee",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_tickets",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="ticket",
            name="priority",
            field=models.CharField(blank=True, default="NORMAL", max_length=20),
        ),
        migrations.AddField(
            model_name="ticket",
            name="tags",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="ticket",
            name="channel",
            field=models.CharField(blank=True, default="inapp", max_length=40),
        ),
        migrations.AddField(
            model_name="ticketreply",
            name="is_internal",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="TicketNote",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("body", models.TextField()),
                (
                    "author",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ticket_notes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "ticket",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notes", to="support.ticket"),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]






