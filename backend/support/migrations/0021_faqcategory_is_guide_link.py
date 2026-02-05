from django.db import migrations, models


def forwards(apps, schema_editor):
    FAQCategory = apps.get_model("support", "FAQCategory")
    # Backfill: existing GUIDE kind categories become guide links.
    try:
        FAQCategory.objects.filter(kind="GUIDE").update(is_guide_link=True)
    except Exception:
        pass


def backwards(apps, schema_editor):
    FAQCategory = apps.get_model("support", "FAQCategory")
    try:
        FAQCategory.objects.all().update(is_guide_link=False)
    except Exception:
        pass


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0020_ai_library_item"),
    ]

    operations = [
        migrations.AddField(
            model_name="faqcategory",
            name="is_guide_link",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(forwards, backwards),
    ]






