const pino = require('pino');

// JSON 한 줄 로그. Promtail → Loki 로 수집되므로 사람이 읽기 좋은 포맷은 쓰지 않는다.
// 로컬에서 보기 좋게 하려면: npm run dev | npx pino-pretty
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'todayhouse-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'password'],
});

module.exports = logger;
