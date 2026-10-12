const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    // 유효성 검사
    if (!email || !password || !nickname) {
      return res.status(400).json({ message: '모든 필드를 입력해주세요' });
    }

    // 중복 확인
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { nickname }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: '이미 사용 중인 이메일 또는 닉네임입니다' });
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname
      }
    });

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: '이메일 또는 비밀번호가 잘못되었습니다' });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: '이메일 또는 비밀번호가 잘못되었습니다' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 현재 사용자 정보
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;