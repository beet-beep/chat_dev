from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from support.models import Profile


class Command(BaseCommand):
    help = "Create/update local dev user/admin accounts with known credentials."

    def handle(self, *args, **options):
        User = get_user_model()

        # User account
        user_email = "test@example.com"
        user_password = "test1234!"
        # IMPORTANT: login uses authenticate(username=email, password=...)
        u, _ = User.objects.get_or_create(email=user_email, defaults={"username": user_email})
        u.username = user_email
        u.is_staff = False
        u.is_superuser = False
        u.set_password(user_password)
        u.save()
        Profile.objects.get_or_create(user=u)
        u.profile.display_name = "test"
        u.profile.save(update_fields=["display_name"])

        # Admin account
        admin_email = "admin@example.com"
        admin_password = "admin1234!"
        a, _ = User.objects.get_or_create(email=admin_email, defaults={"username": admin_email})
        a.username = admin_email
        a.is_staff = True
        a.is_superuser = True
        a.set_password(admin_password)
        a.save()
        Profile.objects.get_or_create(user=a)
        a.profile.display_name = "Admin"
        a.profile.save(update_fields=["display_name"])

        self.stdout.write(self.style.SUCCESS("Created/updated dev accounts:"))
        self.stdout.write(f"- user:  {user_email} / {user_password}")
        self.stdout.write(f"- admin: {admin_email} / {admin_password}")


