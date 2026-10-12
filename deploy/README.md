# 홈서버 배포 메모 (N100 미니PC, Ubuntu)

재부팅 시 기동 순서: Docker(PostgreSQL·모니터링) → Nginx → PM2(백엔드·프론트) → ddclient

1. `docker compose up -d postgres prometheus node-exporter cadvisor grafana`
2. `cd backend && npx prisma migrate deploy`
3. `pm2 start deploy/ecosystem.config.js && pm2 save`
4. Nginx: `deploy/nginx.todayhouse.conf` 를 `/etc/nginx/sites-available/` 에 두고 링크, `certbot --nginx -d todayhouseee.duckdns.org`
5. ddclient: `deploy/ddclient.conf.example` 참고

공유기: 80/443 만 포트포워딩. 9090(Prometheus)·3001(Grafana)·81 등 관리 포트는 외부 미개방, Tailscale 로만 접근.
