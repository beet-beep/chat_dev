from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0021_faqcategory_is_guide_link"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketcategory",
            name="form_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="ticketcategory",
            name="form_button_label",
            field=models.CharField(blank=True, default="기본 양식 넣기", max_length=40),
        ),
        migrations.AddField(
            model_name="ticketcategory",
            name="form_template",
            field=models.TextField(blank=True, default=""),
        ),
    ]






