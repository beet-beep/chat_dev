from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0003_faq_cms"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="phone_number",
            field=models.CharField(blank=True, default="", max_length=40),
        ),
        migrations.AddField(
            model_name="profile",
            name="is_vip",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="profile",
            name="tags",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="profile",
            name="notes",
            field=models.TextField(blank=True, default=""),
        ),
    ]







