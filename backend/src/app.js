require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 라우트 import
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const uploadRoutes = require('./routes/upload');
const { metricsMiddleware, metricsHandler } = require('./metrics');
const logger = require('./logger');
const requestLogger = require('./middleware/requestLogger');

// 미들웨어
app.use(cors());
app.use(metricsMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 정적 파일 서빙
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);

// Prometheus 메트릭 (내부망에서만 노출할 것 — Nginx에서 /metrics 는 외부 차단)
app.get('/metrics', metricsHandler);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  logger.error({ err, requestId: req.id, path: req.originalUrl }, 'unhandled error');
  
  // Multer 에러
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: '파일 크기가 너무 큽니다 (최대 10MB)' });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ message: '파일 개수를 초과했습니다' });
  }

  res.status(err.status || 500).json({
    message: err.message || '서버 오류가 발생했습니다',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ message: '요청한 경로를 찾을 수 없습니다' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'server started');
  });
}

module.exports = app;