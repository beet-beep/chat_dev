from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0018_ticket_client_meta"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="client_meta",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="profile",
            name="game_uuid",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="profile",
            name="member_code",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="profile",
            name="login_provider",
            field=models.CharField(blank=True, default="", max_length=40),
        ),
        migrations.AddField(
            model_name="profile",
            name="payment_info",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="profile",
            name="login_info",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]






