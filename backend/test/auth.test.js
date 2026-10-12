const { app, prisma, request, resetDb, registerUser, auth } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  test('가입하면 201 + 토큰과 사용자 정보를 돌려준다', async () => {
    const r = await registerUser();
    expect(r.status).toBe(201);
    expect(r.token).toEqual(expect.any(String));
    expect(r.user).toMatchObject({ email: r.body.email, nickname: r.body.nickname });
    expect(r.user.password).toBeUndefined();
  });

  test('이메일 형식이 틀리면 400 + 필드명을 알려준다', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'nope', password: 'password123', nickname: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('email');
  });

  test('8자 미만 비밀번호는 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.co', password: 'short', nickname: 'abc' });
    expect(res.status).toBe(400);
  });

  test('같은 이메일로 두 번 가입하면 400', async () => {
    const first = await registerUser({ email: 'dup@test.local' });
    const second = await registerUser({ email: 'dup@test.local' });
    expect(first.status).toBe(201);
    expect(second.status).toBe(400);
  });
});

describe('POST /api/auth/login · GET /api/auth/me', () => {
  test('맞는 비밀번호면 토큰, 틀리면 400', async () => {
    const u = await registerUser();
    const ok = await request(app).post('/api/auth/login').send({ email: u.body.email, password: u.body.password });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toEqual(expect.any(String));

    const bad = await request(app).post('/api/auth/login').send({ email: u.body.email, password: 'wrong-password' });
    expect(bad.status).toBe(400);
  });

  test('/me 는 토큰 없으면 401, 있으면 내 정보', async () => {
    const u = await registerUser();
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const me = await request(app).get('/api/auth/me').set(auth(u.token));
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(u.body.email);
  });
});
