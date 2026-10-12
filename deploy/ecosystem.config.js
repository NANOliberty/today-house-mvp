// PM2 설정 — 서버에서: pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'todayhouse-backend',
      cwd: './backend',
      script: 'src/app.js',
      env: { NODE_ENV: 'production', PORT: 5000 },
      max_memory_restart: '300M',
      time: true,
    },
    {
      name: 'todayhouse-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run start -- -p 3002',
      env: { NODE_ENV: 'production', NEXT_PUBLIC_API_URL: 'https://todayhouseee.duckdns.org/api' },
      time: true,
    },
  ],
};
