from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0017_faqcategory_kind"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="user_device",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
        migrations.AddField(
            model_name="ticket",
            name="user_locale",
            field=models.CharField(blank=True, default="", max_length=40),
        ),
        migrations.AddField(
            model_name="ticket",
            name="user_location",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
    ]






