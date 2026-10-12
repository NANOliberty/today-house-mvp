const { z } = require('zod');

const CATEGORIES = ['거실', '침실', '주방', '욕실', '복도', '현관', '기타'];

const registerSchema = z.object({
  email: z.string().email('이메일 형식이 아닙니다').max(100),
  password: z.string().min(8, '비밀번호는 8자 이상').max(72),
  nickname: z.string().trim().min(2, '닉네임은 2자 이상').max(20),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const postSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요').max(100),
  content: z.string().trim().min(1, '내용을 입력해주세요').max(10000),
  category: z.string().trim().min(1, '카테고리를 선택해주세요').max(20),
  imageUrl: z.string().max(500).optional().nullable(),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, '댓글을 입력해주세요').max(1000),
});

module.exports = { CATEGORIES, registerSchema, loginSchema, postSchema, commentSchema };
