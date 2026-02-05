from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def _upload_to_faq(instance, filename: str) -> str:
    return f"faqs/{instance.faq_id}/{filename}"


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0002_attachments"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="faqcategory",
            name="guide_url",
            field=models.URLField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="faq",
            name="blocks",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.CreateModel(
            name="FAQAttachment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("file", models.FileField(upload_to=_upload_to_faq)),
                ("original_name", models.CharField(blank=True, default="", max_length=255)),
                ("content_type", models.CharField(blank=True, default="", max_length=120)),
                ("faq", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attachments", to="support.faq")),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="faq_attachments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]







