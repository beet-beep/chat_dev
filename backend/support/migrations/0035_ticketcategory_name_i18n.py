from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("support", "0034_fix_faqcategory_kind"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketcategory",
            name="name_i18n",
            field=models.JSONField(blank=True, default=dict, help_text='{"en":"...","ja":"...","zh-TW":"..."}'),
        ),
    ]
