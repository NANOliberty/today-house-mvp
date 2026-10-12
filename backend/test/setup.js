// 테스트 전용 환경. DATABASE_URL 이 없으면 로컬 compose 의 테스트 DB 를 가리킨다.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://todayhouse:todayhouse123@localhost:5433/todayhouse_test';
