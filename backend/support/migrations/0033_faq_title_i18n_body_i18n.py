from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("support", "0032_ticket_reopened_at_vocentry"),
    ]

    operations = [
        migrations.AddField(
            model_name="faq",
            name="title_i18n",
            field=models.JSONField(blank=True, default=dict, help_text='{"en":"...","ja":"...","zh-TW":"..."}'),
        ),
        migrations.AddField(
            model_name="faq",
            name="body_i18n",
            field=models.JSONField(blank=True, default=dict, help_text='{"en":"...","ja":"...","zh-TW":"..."}'),
        ),
    ]
