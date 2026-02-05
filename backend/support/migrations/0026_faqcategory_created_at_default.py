"""Auto migration to set default for FAQCategory.created_at to avoid interactive prompts."""
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("support", "0025_add_tickettag_hierarchy"),
    ]

    operations = [
        migrations.AddField(
            model_name="faqcategory",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
