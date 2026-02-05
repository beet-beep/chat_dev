from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0023_ticketcategory_form_title_and_checklist"),
    ]

    operations = [
        migrations.AddField(
            model_name="faq",
            name="is_hidden",
            field=models.BooleanField(default=False),
        ),
    ]






