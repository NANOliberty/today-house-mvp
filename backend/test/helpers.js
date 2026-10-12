const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/app');

const prisma = new PrismaClient();

async function resetDb() {
  // FK 순서대로 비운다 (Like/Comment → Post → User)
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}

let seq = 0;
async function registerUser(overrides = {}) {
  seq += 1;
  const body = {
    email: `user${seq}@test.local`,
    password: 'password123',
    nickname: `tester${seq}`,
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return { ...res.body, body, status: res.status };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { app, prisma, request, resetDb, registerUser, auth };
