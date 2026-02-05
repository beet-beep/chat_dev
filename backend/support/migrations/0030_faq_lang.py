from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("support", "0029_add_faq_view_tracking"),
    ]

    operations = [
        migrations.AddField(
            model_name="faq",
            name="lang",
            field=models.CharField(
                choices=[("ko", "한국어"), ("en", "English"), ("ja", "日本語"), ("zh-TW", "繁體中文")],
                db_index=True,
                default="ko",
                max_length=10,
            ),
        ),
    ]
