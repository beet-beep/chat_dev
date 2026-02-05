from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from urllib.parse import quote

from support.models import FAQ, FAQCategory, Profile, Ticket, TicketCategory, TicketReply

User = get_user_model()


class Command(BaseCommand):
    help = "Seed support/FAQ/ticket sample data for local dev"

    def handle(self, *args, **options):
        # Demo User (requested: "test")
        email = "test@joody.local"
        password = "password1234"
        user, created = User.objects.get_or_create(email=email, defaults={"username": email, "first_name": "test"})
        if created:
            user.set_password(password)
            user.save()
        # generate a cute slime avatar (data URL SVG)
        svg = """<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F97316"/><stop offset="1" stop-color="#FDBA74"/>
  </linearGradient>
</defs>
<rect width="128" height="128" rx="28" fill="url(#g)"/>
<path d="M28 78c0-22 16-40 36-40s36 18 36 40c0 14-10 22-18 22H46c-8 0-18-8-18-22z" fill="rgba(255,255,255,0.92)"/>
<circle cx="52" cy="74" r="6" fill="#1F2937"/><circle cx="76" cy="74" r="6" fill="#1F2937"/>
<path d="M54 88c6 6 14 6 20 0" stroke="#1F2937" stroke-width="5" stroke-linecap="round" fill="none"/>
</svg>"""
        avatar_url = "data:image/svg+xml;utf8," + quote(svg)
        Profile.objects.get_or_create(
            user=user, defaults={"display_name": "test", "avatar_url": avatar_url, "phone_number": "+82 10-0000-0000"}
        )

        # Admin (staff)
        admin_email = "admin@joody.local"
        admin_password = "password1234"
        admin_user, admin_created = User.objects.get_or_create(
            email=admin_email,
            defaults={"username": admin_email, "is_staff": True, "is_superuser": True, "first_name": "관리자"},
        )
        if admin_created:
            admin_user.set_password(admin_password)
            admin_user.save()

        # FAQ categories + FAQs (피그마/스크린샷에 보이는 인기문서)
        faq_cat, _ = FAQCategory.objects.get_or_create(name="주디 - 가이드", defaults={"order": 0})
        FAQ.objects.get_or_create(
            title="회원가입은 어떻게 하나요?",
            defaults={"category": faq_cat, "body": "앱에서 이메일로 회원가입을 진행할 수 있어요.", "is_popular": True, "order": 0},
        )
        FAQ.objects.get_or_create(
            title="비밀번호를 잊어버렸어요",
            defaults={"category": faq_cat, "body": "로그인 화면에서 비밀번호 재설정을 진행해주세요.", "is_popular": True, "order": 1},
        )
        FAQ.objects.get_or_create(
            title="결제는 어떤 방법이 가능한가요?",
            defaults={"category": faq_cat, "body": "신용카드/간편결제를 지원합니다.", "is_popular": True, "order": 2},
        )
        FAQ.objects.get_or_create(
            title="환불 정책이 궁금해요",
            defaults={"category": faq_cat, "body": "결제 후 7일 이내 미사용 시 환불이 가능합니다.", "is_popular": True, "order": 3},
        )
        FAQ.objects.get_or_create(
            title="서비스 이용 요금은 얼마인가요?",
            defaults={"category": faq_cat, "body": "플랜별 요금은 앱 내 구독 화면에서 확인할 수 있어요.", "is_popular": True, "order": 4},
        )

        # Ticket categories (+ SupportBot)
        cat_pay, _ = TicketCategory.objects.get_or_create(
            name="결제 문의",
            defaults={
                "order": 0,
                "bot_enabled": True,
                "bot_title": "주디 서포트봇",
                "bot_blocks": [
                    {"type": "paragraph", "text": "결제/환불 문의 전 체크해 주세요.\n1) 결제 영수증 캡처\n2) 결제 수단(카드/간편결제)\n3) 결제일/상품명"},
                    {"type": "paragraph", "text": "환불 정책: 결제 후 7일 이내 미사용 시 환불 가능해요."},
                ],
            },
        )
        cat_other, _ = TicketCategory.objects.get_or_create(
            name="기타 문의",
            defaults={
                "order": 7,
                "bot_enabled": True,
                "bot_title": "주디 서포트봇",
                "bot_blocks": [
                    {"type": "paragraph", "text": "로그인/네트워크 오류라면 아래를 먼저 확인해 주세요.\n- 앱 재실행\n- Wi‑Fi/데이터 전환\n- 최신 버전 업데이트\n- 오류 화면 캡처"},
                ],
            },
        )
        cat_account, _ = TicketCategory.objects.get_or_create(
            name="계정 관리",
            defaults={
                "order": 2,
                "bot_enabled": True,
                "bot_title": "주디 서포트봇",
                "bot_blocks": [
                    {"type": "paragraph", "text": "이메일 변경/계정 복구는 보안을 위해 본인 확인이 필요해요.\n- 기존 이메일\n- 변경 희망 이메일\n- 계정 생성일(대략)"},
                ],
            },
        )
        cat_feature, _ = TicketCategory.objects.get_or_create(
            name="기능 문의",
            defaults={
                "order": 3,
                "bot_enabled": True,
                "bot_title": "주디 서포트봇",
                "bot_blocks": [
                    {"type": "paragraph", "text": "원하는 기능을 구체적으로 알려주면 더 빨리 도와줄 수 있어요.\n- 목적(왜 필요한지)\n- 현재 불편한 점\n- 기대 동작(예시)"},
                ],
            },
        )
        TicketCategory.objects.get_or_create(
            name="건의사항",
            defaults={
                "order": 4,
                "bot_enabled": True,
                "bot_title": "주디 서포트봇",
                "bot_blocks": [
                    {"type": "paragraph", "text": "건의사항은 꼼꼼히 읽고 반영해요.\n- 어떤 점이 불편했나요?\n- 원하는 개선 방향(예시 포함)\n- 참고 스크린샷/영상(첨부)"},
                ],
            },
        )
        TicketCategory.objects.get_or_create(
            name="오류 제보",
            defaults={
                "order": 5,
                "bot_enabled": True,
                "bot_title": "주디 서포트봇",
                "bot_blocks": [
                    {"type": "paragraph", "text": "오류 제보 시 아래 정보를 함께 보내주시면 빨라요.\n- 오류 화면 캡처/영상\n- 발생 시간\n- 재현 방법(순서)\n- 기기/OS/앱 버전"},
                ],
            },
        )
        TicketCategory.objects.get_or_create(
            name="불량 이용자 신고",
            defaults={
                "order": 6,
                "bot_enabled": True,
                "bot_title": "주디 서포트봇",
                "bot_blocks": [
                    {"type": "paragraph", "text": "신고 접수 시 아래 자료가 필요해요.\n- 상대 닉네임/ID\n- 발생 시간\n- 대화/행동 증거(캡처)\n- 상세 내용"},
                ],
            },
        )
        TicketCategory.objects.get_or_create(
            name="이벤트/보상",
            defaults={
                "order": 1,
                "bot_enabled": True,
                "bot_title": "주디 서포트봇",
                "bot_blocks": [
                    {"type": "paragraph", "text": "이벤트/보상 문의 전 확인해 주세요.\n- 이벤트명\n- 참여 날짜/시간\n- 미지급/오류 내용\n- 스크린샷(첨부)"},
                ],
            },
        )

        # Tickets (스크린샷 예시)
        t1, _ = Ticket.objects.get_or_create(
            user=user,
            title="환불 요청 건",
            defaults={
                "category": cat_pay,
                "body": "지난 주에 결제한 프리미엄 플랜을 환불받고 싶습니다. 서비스 이용이 어려워서 환불 가능한지 확인 부탁드립니다.",
                "status": Ticket.Status.ANSWERED,
            },
        )
        TicketReply.objects.get_or_create(
            ticket=t1,
            body="환불 가능 여부를 확인 후 안내드릴게요. 결제 영수증 정보를 함께 보내주시면 더 빠르게 도와드릴 수 있어요.",
            defaults={"author": None},
        )

        Ticket.objects.get_or_create(
            user=user,
            title="로그인 오류 발생",
            defaults={
                "category": cat_other,
                "body": '앱에서 로그인을 시도하면 계속 "네트워크 오류"가 발생합니다. 와이파이와 모바일 데이터 둘 다 시도해봤는데 같은 증상입니다.',
                "status": Ticket.Status.PENDING,
            },
        )
        Ticket.objects.get_or_create(
            user=user,
            title="이메일 변경 요청",
            defaults={
                "category": cat_account,
                "body": "회사 이메일에서 개인 이메일로 계정을 변경하고 싶습니다. 절차를 알려주세요.",
                "status": Ticket.Status.PENDING,
            },
        )
        t4, _ = Ticket.objects.get_or_create(
            user=user,
            title="엑셀 내보내기 기능",
            defaults={
                "category": cat_feature,
                "body": "대시보드의 데이터를 엑셀로 내보낼 수 있나요? 월간 보고서 작성을 위해 필요합니다.",
                "status": Ticket.Status.ANSWERED,
            },
        )
        TicketReply.objects.get_or_create(
            ticket=t4,
            body="현재는 CSV 다운로드를 지원하고 있으며, 엑셀(xlsx)은 곧 추가될 예정입니다.",
            defaults={"author": None},
        )

        self.stdout.write(self.style.SUCCESS("Seed completed."))
        self.stdout.write(f"- demo user: {email} / {password}")
        self.stdout.write(f"- admin user: {admin_email} / {admin_password}")


