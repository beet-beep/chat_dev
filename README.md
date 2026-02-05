# Joody Chat - 고객센터 (React + Django REST)

피그마 시안(FAQ / 문의하기 / 문의내역 / 내정보)을 기반으로 만든 **고객센터** 예제 프로젝트입니다.

## 구성

- **frontend/**: React (Vite + TypeScript) + MUI
- **backend/**: Django + Django REST Framework (Token Auth)

## 빠른 실행 (로컬)

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_support_data
python manage.py runserver 8000
```

기본 API 주소: `http://127.0.0.1:8000/api/`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

프론트 기본 주소: `http://127.0.0.1:5173/`

## 계정/로그인

- 회원가입: `POST /api/auth/register/` (email, password, name)
- 로그인: `POST /api/auth/login/` → token 반환
- 프론트는 로그인 토큰을 localStorage(`auth_token`)에 저장해 API 호출에 사용합니다.

## 주요 API

- FAQ
  - `GET /api/faq-categories/`
  - `GET /api/faqs/?is_popular=true`
- 문의
  - `GET /api/tickets/`
  - `POST /api/tickets/`
  - `GET /api/tickets/:id/`
- 내 정보
  - `GET /api/me/`







