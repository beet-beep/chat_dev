from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0008_presets"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="staff_seen_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="ticket",
            name="user_seen_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]






