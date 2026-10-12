const { app, prisma, request, resetDb, registerUser, auth } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const samplePost = { title: '우리집 거실', content: '소파를 바꿨어요', category: '거실' };

async function createPost(token, body = samplePost) {
  return request(app).post('/api/posts').set(auth(token)).send(body);
}

describe('게시글 CRUD', () => {
  test('로그인 없이 작성하면 401', async () => {
    const res = await request(app).post('/api/posts').send(samplePost);
    expect(res.status).toBe(401);
  });

  test('필수값 빠지면 400 (zod)', async () => {
    const u = await registerUser();
    const res = await createPost(u.token, { title: '', content: 'x', category: '거실' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toContain('title');
  });

  test('작성 → 목록 → 상세(조회수 +1)', async () => {
    const u = await registerUser();
    const created = await createPost(u.token);
    expect(created.status).toBe(201);
    expect(created.body.author.nickname).toBe(u.body.nickname);

    const list = await request(app).get('/api/posts');
    expect(list.status).toBe(200);
    expect(list.body.posts).toHaveLength(1);

    const detail = await request(app).get(`/api/posts/${created.body.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.viewCount).toBe(1);
    expect(detail.body._count).toEqual({ likes: 0, comments: 0 });
  });

  test('남의 글은 수정·삭제 403, 내 글은 200', async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const { body: post } = await createPost(owner.token);

    const edit = { ...samplePost, title: '바뀐 제목' };
    expect((await request(app).put(`/api/posts/${post.id}`).set(auth(other.token)).send(edit)).status).toBe(403);
    expect((await request(app).delete(`/api/posts/${post.id}`).set(auth(other.token))).status).toBe(403);

    const mine = await request(app).put(`/api/posts/${post.id}`).set(auth(owner.token)).send(edit);
    expect(mine.status).toBe(200);
    expect(mine.body.title).toBe('바뀐 제목');
    expect((await request(app).delete(`/api/posts/${post.id}`).set(auth(owner.token))).status).toBe(200);
    expect((await request(app).get(`/api/posts/${post.id}`)).status).toBe(404);
  });

  test('카테고리 필터와 검색', async () => {
    const u = await registerUser();
    await createPost(u.token, { ...samplePost, category: '거실', title: '거실 조명' });
    await createPost(u.token, { ...samplePost, category: '침실', title: '침실 커튼' });

    const living = await request(app).get('/api/posts?category=거실');
    expect(living.body.posts.map((p) => p.title)).toEqual(['거실 조명']);

    const search = await request(app).get('/api/posts/search?q=커튼');
    expect(search.status).toBe(200);
    expect(search.body.posts.map((p) => p.title)).toEqual(['침실 커튼']);
  });
});

describe('좋아요 · 댓글', () => {
  test('좋아요는 토글이고 상세에 isLiked 가 반영된다', async () => {
    const u = await registerUser();
    const { body: post } = await createPost(u.token);

    const on = await request(app).post(`/api/posts/${post.id}/like`).set(auth(u.token));
    expect(on.body).toEqual({ liked: true });
    let detail = await request(app).get(`/api/posts/${post.id}`).set(auth(u.token));
    expect(detail.body.isLiked).toBe(true);
    expect(detail.body._count.likes).toBe(1);

    const off = await request(app).post(`/api/posts/${post.id}/like`).set(auth(u.token));
    expect(off.body).toEqual({ liked: false });
    detail = await request(app).get(`/api/posts/${post.id}`).set(auth(u.token));
    expect(detail.body.isLiked).toBe(false);
    expect(detail.body._count.likes).toBe(0);
  });

  test('댓글 작성 후 상세에 포함되고, 삭제하면 빠진다', async () => {
    const u = await registerUser();
    const { body: post } = await createPost(u.token);

    const c = await request(app).post(`/api/posts/${post.id}/comments`).set(auth(u.token)).send({ content: '좋네요' });
    expect(c.status).toBe(201);

    let detail = await request(app).get(`/api/posts/${post.id}`);
    expect(detail.body.comments).toHaveLength(1);
    expect(detail.body._count.comments).toBe(1);

    const del = await request(app).delete(`/api/posts/${post.id}/comments/${c.body.id}`).set(auth(u.token));
    expect(del.status).toBe(200);
    detail = await request(app).get(`/api/posts/${post.id}`);
    expect(detail.body.comments).toHaveLength(0);
  });
});
