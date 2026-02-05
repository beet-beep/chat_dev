from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0015_ticket_attachment_public_id"),
    ]

    operations = [
        migrations.AlterField(
            model_name="faq",
            name="body",
            field=models.TextField(blank=True, default=""),
        ),
    ]






