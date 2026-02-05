from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("support", "0035_ticketcategory_name_i18n"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketcategory",
            name="guide_description_i18n",
            field=models.JSONField(blank=True, default=dict, help_text='{"en":"...","ja":"...","zh-TW":"..."}'),
        ),
    ]
