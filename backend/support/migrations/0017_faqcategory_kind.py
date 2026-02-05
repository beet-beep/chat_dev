from django.db import migrations, models


def set_guide_kind(apps, schema_editor):
    FAQCategory = apps.get_model("support", "FAQCategory")
    # Best-effort: mark any "가이드" category as GUIDE
    for c in FAQCategory.objects.all():
        name = (getattr(c, "name", "") or "")
        if "가이드" in name:
            c.kind = "GUIDE"
        elif "결제" in name:
            c.kind = "PAYMENT"
        elif "계정" in name:
            c.kind = "ACCOUNT"
        else:
            c.kind = "GENERAL"
        c.save(update_fields=["kind"])


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0016_faq_body_blank"),
    ]

    operations = [
        migrations.AddField(
            model_name="faqcategory",
            name="kind",
            field=models.CharField(
                choices=[("GUIDE", "가이드"), ("PAYMENT", "결제 문서"), ("ACCOUNT", "계정 문서"), ("GENERAL", "전체 문서")],
                default="GENERAL",
                max_length=20,
            ),
        ),
        migrations.RunPython(set_guide_kind, migrations.RunPython.noop),
    ]






