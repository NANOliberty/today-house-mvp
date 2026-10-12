const client = require('prom-client');

// 기본 Node.js 프로세스 메트릭 (CPU, 메모리, 이벤트루프 지연 등)
client.collectDefaultMetrics({ prefix: 'todayhouse_' });

const httpRequestDuration = new client.Histogram({
  name: 'todayhouse_http_request_duration_seconds',
  help: 'HTTP 요청 처리 시간(초)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const httpRequestsTotal = new client.Counter({
  name: 'todayhouse_http_requests_total',
  help: 'HTTP 요청 수',
  labelNames: ['method', 'route', 'status_code'],
});

// 라우트 라벨은 "/api/posts/:id" 처럼 파라미터 패턴으로 정규화 (카디널리티 폭발 방지)
function routeLabel(req) {
  if (req.route && req.baseUrl !== undefined) return req.baseUrl + req.route.path;
  return req.path.replace(/\/\d+/g, '/:id');
}

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') return next();
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: routeLabel(req), status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
}

async function metricsHandler(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}

module.exports = { metricsMiddleware, metricsHandler };
