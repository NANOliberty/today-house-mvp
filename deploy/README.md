# 홈서버 배포 메모 (N100 미니PC, Ubuntu)

재부팅 시 기동 순서: Docker(PostgreSQL·모니터링) → Nginx → PM2(백엔드·프론트) → ddclient

1. 모니터링만 띄운다 (postgres 는 기존 컨테이너, 백엔드/프론트는 PM2):
   `docker compose -f docker-compose.yml -f docker-compose.server.yml up -d prometheus node-exporter cadvisor loki promtail grafana`
   - 서버 오버레이는 백엔드를 `host.docker.internal:5000` 으로 긁고, 관리 포트를 127.0.0.1 에만 바인딩한다
2. `cd backend && npx prisma migrate deploy`
3. 프론트 빌드 전에 `frontend/.env.production` 에 `NEXT_PUBLIC_API_URL=https://todayhouseee.duckdns.org/api` 를 둔다 (NEXT_PUBLIC_* 은 빌드 시점에 박힘 — ecosystem 의 env 로는 안 바뀜). 그다음 `npm run build --prefix frontend`
4. `pm2 start deploy/ecosystem.config.js && pm2 save`
5. Nginx: `deploy/nginx.todayhouse.conf` 를 `/etc/nginx/sites-available/` 에 두고 링크, `certbot --nginx -d todayhouseee.duckdns.org`
6. ddclient: `deploy/ddclient.conf.example` 참고

공유기: 80/443 만 포트포워딩. 9090(Prometheus)·3001(Grafana)·81 등 관리 포트는 외부 미개방, Tailscale 로만 접근.

## 로그 · 알림 · 백업

- 로그: 백엔드가 pino JSON 로그를 stdout 으로 내면 Promtail 이 Docker 로그를 Loki 로 보내고 Grafana 에서 메트릭과 같이 본다. 로컬에서 읽기 좋게: `npm run dev | npx pino-pretty`
- 알림: Grafana 규칙 3개(백엔드 다운 2분 / 5xx 5% / 디스크 10%) → Discord 웹후크(`DISCORD_WEBHOOK_URL`)
- 홈서버에서는 `.env` 의 `PM2_LOG_DIR=/home/<user>/.pm2/logs` 로 두면 Promtail 이 PM2 로그 파일을 읽는다
- 백업: `scripts/backup-db.sh` 를 crontab 에 등록 (`0 4 * * *`), `~/backups/todayhouse/` 에 7일 보관

## 서버가 오래 꺼져 있었다면

- `docker start todayhouse-db` (restart 정책: `docker update --restart unless-stopped todayhouse-db`)
- 인증서 만료 확인 `sudo certbot certificates`, 만료면 `sudo certbot renew --force-renewal --nginx`
- nginx upstream 포트가 PM2 포트(3002/5000)와 맞는지 `sudo nginx -T | grep -A2 upstream`
