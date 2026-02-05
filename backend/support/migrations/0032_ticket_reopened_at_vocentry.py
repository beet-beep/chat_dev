from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("support", "0031_faqcategory_name_i18n"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="reopened_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="VocEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("voc_type", models.CharField(choices=[("BUG", "버그"), ("SUGGESTION", "건의사항"), ("COMPLAINT", "불만"), ("PRAISE", "칭찬"), ("OTHER", "기타")], db_index=True, default="OTHER", max_length=20)),
                ("status", models.CharField(choices=[("NEW", "신규"), ("REVIEWING", "검토중"), ("PLANNED", "반영예정"), ("DONE", "반영완료"), ("REJECTED", "반려")], db_index=True, default="NEW", max_length=20)),
                ("severity", models.CharField(choices=[("LOW", "낮음"), ("MEDIUM", "보통"), ("HIGH", "높음"), ("CRITICAL", "긴급")], default="MEDIUM", max_length=20)),
                ("summary", models.TextField(blank=True)),
                ("keywords", models.JSONField(blank=True, default=list)),
                ("sentiment", models.CharField(blank=True, max_length=20)),
                ("sentiment_score", models.FloatField(default=0)),
                ("category", models.CharField(blank=True, max_length=100)),
                ("impact_score", models.IntegerField(default=5)),
                ("ai_analysis", models.JSONField(blank=True, default=dict)),
                ("action_items", models.JSONField(blank=True, default=list)),
                ("admin_note", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("ticket", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="voc_entries", to="support.ticket")),
            ],
            options={
                "verbose_name_plural": "VOC entries",
                "ordering": ["-created_at"],
            },
        ),
    ]
