from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("support", "0036_ticketcategory_guide_description_i18n"),
    ]

    operations = [
        migrations.AddField(model_name="ticketcategory", name="bot_title_i18n", field=models.JSONField(blank=True, default=dict)),
        migrations.AddField(model_name="ticketcategory", name="bot_blocks_i18n", field=models.JSONField(blank=True, default=dict)),
        migrations.AddField(model_name="ticketcategory", name="form_button_label_i18n", field=models.JSONField(blank=True, default=dict)),
        migrations.AddField(model_name="ticketcategory", name="form_template_i18n", field=models.JSONField(blank=True, default=dict)),
        migrations.AddField(model_name="ticketcategory", name="form_title_template_i18n", field=models.JSONField(blank=True, default=dict)),
        migrations.AddField(model_name="ticketcategory", name="form_checklist_i18n", field=models.JSONField(blank=True, default=dict)),
    ]
