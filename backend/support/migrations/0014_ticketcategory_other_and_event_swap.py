from django.db import migrations


def forwards(apps, schema_editor):
    TicketCategory = apps.get_model("support", "TicketCategory")

    # rename "기술 지원" -> "기타 문의"
    tech = TicketCategory.objects.filter(name="기술 지원").first()
    other = TicketCategory.objects.filter(name="기타 문의").first()

    if tech and not other:
        tech.name = "기타 문의"
        tech.save(update_fields=["name"])
        other = tech

    event = TicketCategory.objects.filter(name="이벤트/보상").first()

    # swap order between (기타 문의) and (이벤트/보상)
    if other and event:
        a = other.order
        b = event.order
        other.order = b
        event.order = a
        other.save(update_fields=["order"])
        event.save(update_fields=["order"])


def backwards(apps, schema_editor):
    TicketCategory = apps.get_model("support", "TicketCategory")

    other = TicketCategory.objects.filter(name="기타 문의").first()
    event = TicketCategory.objects.filter(name="이벤트/보상").first()

    if other and event:
        a = other.order
        b = event.order
        other.order = b
        event.order = a
        other.save(update_fields=["order"])
        event.save(update_fields=["order"])

    # rename back
    if other:
        other.name = "기술 지원"
        other.save(update_fields=["name"])


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0013_profile_avatar_file"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]






