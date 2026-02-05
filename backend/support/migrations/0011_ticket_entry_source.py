from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0010_ticketcategory_supportbot"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="entry_source",
            field=models.CharField(blank=True, default="", max_length=40),
        ),
    ]






