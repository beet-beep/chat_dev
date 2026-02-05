"""Fix FAQCategory.kind values – collapse legacy PAYMENT/ACCOUNT to GENERAL."""

from django.db import migrations


def fix_kind_values(apps, schema_editor):
    FAQCategory = apps.get_model("support", "FAQCategory")
    FAQCategory.objects.exclude(kind__in=["GENERAL", "GUIDE"]).update(kind="GENERAL")


class Migration(migrations.Migration):

    dependencies = [
        ("support", "0033_faq_title_i18n_body_i18n"),
    ]

    operations = [
        migrations.RunPython(fix_kind_values, migrations.RunPython.noop),
    ]
