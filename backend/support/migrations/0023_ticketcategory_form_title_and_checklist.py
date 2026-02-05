from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0022_ticketcategory_form_template"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketcategory",
            name="form_title_template",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="ticketcategory",
            name="form_checklist",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="ticketcategory",
            name="form_checklist_required",
            field=models.BooleanField(default=False),
        ),
    ]






