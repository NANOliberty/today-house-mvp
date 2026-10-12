const crypto = require('crypto');
const logger = require('../logger');

// 요청 1건 = 로그 1줄. requestId 로 메트릭/로그를 연결한다.
module.exports = function requestLogger(req, res, next) {
  if (req.path === '/metrics' || req.path === '/health') return next();
  const start = process.hrtime.bigint();
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const entry = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(ms * 10) / 10,
      userId: req.userId || null,
      ip: req.headers['x-real-ip'] || req.ip,
    };
    if (res.statusCode >= 500) logger.error(entry, 'request failed');
    else if (res.statusCode >= 400) logger.warn(entry, 'request rejected');
    else logger.info(entry, 'request');
  });
  next();
};
