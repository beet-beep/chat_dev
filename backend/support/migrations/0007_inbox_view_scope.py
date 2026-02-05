from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0006_inbox_views"),
    ]

    operations = [
        migrations.AddField(
            model_name="admininboxview",
            name="scope",
            field=models.CharField(blank=True, default="PERSONAL", max_length=20),
        ),
    ]






