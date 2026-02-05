import uuid

from django.db import migrations, models


def backfill_public_ids(apps, schema_editor):
    TicketAttachment = apps.get_model("support", "TicketAttachment")
    TicketReplyAttachment = apps.get_model("support", "TicketReplyAttachment")

    for obj in TicketAttachment.objects.filter(public_id__isnull=True).only("id"):
        obj.public_id = uuid.uuid4()
        obj.save(update_fields=["public_id"])

    for obj in TicketReplyAttachment.objects.filter(public_id__isnull=True).only("id"):
        obj.public_id = uuid.uuid4()
        obj.save(update_fields=["public_id"])


class Migration(migrations.Migration):
    dependencies = [
        ("support", "0014_ticketcategory_other_and_event_swap"),
    ]

    operations = [
        # Step 1: add nullable field so existing rows don't collide with a single default value.
        migrations.AddField(
            model_name="ticketattachment",
            name="public_id",
            field=models.UUIDField(null=True, blank=True, editable=False, unique=True),
        ),
        migrations.AddField(
            model_name="ticketreplyattachment",
            name="public_id",
            field=models.UUIDField(null=True, blank=True, editable=False, unique=True),
        ),
        # Step 2: backfill unique UUIDs per row.
        migrations.RunPython(backfill_public_ids, migrations.RunPython.noop),
        # Step 3: enforce non-null + default for new rows.
        migrations.AlterField(
            model_name="ticketattachment",
            name="public_id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name="ticketreplyattachment",
            name="public_id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]


