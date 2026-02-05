from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0009_ticket_seen"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketcategory",
            name="bot_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="ticketcategory",
            name="bot_title",
            field=models.CharField(blank=True, default="주디 서포트봇", max_length=120),
        ),
        migrations.AddField(
            model_name="ticketcategory",
            name="bot_blocks",
            field=models.JSONField(blank=True, default=list),
        ),
    ]






