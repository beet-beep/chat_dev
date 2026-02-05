from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("support", "0030_faq_lang"),
    ]

    operations = [
        migrations.AddField(
            model_name="faqcategory",
            name="name_i18n",
            field=models.JSONField(blank=True, default=dict, help_text='{"en":"...","ja":"...","zh-TW":"..."}'),
        ),
    ]
