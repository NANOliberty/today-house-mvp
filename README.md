# Today House MVP — 오늘의집 클론 (게시판) · 홈서버 배포

인테리어 커뮤니티 "오늘의집"의 게시판 기능을 클론하고, N100 미니PC 홈서버에 HTTPS로 배포·운영한 프로젝트.
2025-2 숭실대 학습공동체 "복학즈"(홈서버 구축으로 네트워크·배포 실습) 최종 과제.

- 서비스: https://todayhouseee.duckdns.org
- 기간: 2025.11 ~ 2025.12
- 스택: Next.js 14 · TypeScript · Zustand / Express · Prisma · PostgreSQL · JWT · Multer+Sharp / Nginx · PM2 · Docker · Prometheus · Grafana

## 시스템 구성

```
인터넷 ── https://todayhouseee.duckdns.org (DuckDNS, ddclient 5분 갱신)
   │
공유기 (포트포워딩 80/443 만 개방)
   │
N100 홈서버
   ├─ Nginx :443  ── SSL 종료 (Let's Encrypt)
   │     ├─ /       → Next.js :3002  (PM2)
   │     ├─ /api    → Express :5000  (PM2)
   │     └─ /metrics → 404 (외부 차단)
   ├─ PostgreSQL :5432          (Docker)
   └─ 모니터링 (Docker, 내부망 전용)
         Prometheus :9090 ← backend /metrics, node-exporter, cAdvisor
         Grafana    :3001
```

요청 흐름: DNS → 공유기 NAT → Nginx가 Host/경로로 분기 → `/api`는 Express가 Prisma로 PostgreSQL 조회 → JSON 응답. 관리 포트(Grafana·Prometheus)는 포트포워딩하지 않고 Tailscale로만 접근.

## 기능 / API

인증 `/api/auth`
- `POST /register` 회원가입 · `POST /login` 로그인(JWT 발급) · `GET /me` 내 정보

게시글 `/api/posts`
- `GET /` 목록(페이지네이션 · 카테고리 필터) · `GET /search?q=` 검색 · `GET /:id` 상세(조회수 증가)
- `POST /` 작성 · `PUT /:id` 수정 · `DELETE /:id` 삭제 (본인 글만)
- `POST /:id/like` 좋아요 토글 · `POST /:id/comments` 댓글 · `DELETE /:postId/comments/:commentId`

업로드 `/api/upload`
- `POST /` 이미지 1장 · `POST /multiple` 최대 5장 — Sharp로 webp 변환 + 썸네일 생성

운영
- `GET /health` 헬스체크 · `GET /metrics` Prometheus 메트릭(요청 수·p95 지연·5xx 비율·프로세스 메모리)

## 데이터 모델 (Prisma)

`User` 1─N `Post` 1─N `Comment`, `User` N─N `Post` via `Like`. 게시글 삭제 시 좋아요·댓글 cascade.

## 로컬 실행

```bash
cp .env.example .env            # 비밀값 채우기
docker compose up -d            # postgres + backend + frontend + 모니터링
cd backend && npx prisma migrate dev
```

- 프론트 http://localhost:3000 · API http://localhost:5001 (macOS는 5000을 AirPlay가 점유해 호스트 포트만 5001로 매핑) · Grafana http://localhost:3001 · Prometheus http://localhost:9090

## 홈서버 배포

`deploy/` 참고 — Nginx 사이트 설정, PM2 ecosystem, ddclient 예시, 재부팅 시 기동 순서.

## 운영하며 배운 것

- Nginx가 SSL을 종료하므로 앱은 HTTP만 알면 된다. 대신 `X-Forwarded-Proto`가 없으면 앱이 자기 주소를 http로 만든다.
- 502는 거의 항상 "뒤에 프로세스가 없다"(PM2 중지), 403은 파일 권한, 타임아웃은 DDNS IP 불일치였다.
- 관리 포트는 열지 않는다. 열어야 하는 최소(80/443)만 열고 나머지는 Tailscale.
- 이 저장소는 학습공동체 종료 후 정리한 것으로, 모니터링(Prometheus/Grafana)과 `deploy/`는 정리 과정에서 추가했다.
