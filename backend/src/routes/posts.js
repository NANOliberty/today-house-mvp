const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { postSchema, commentSchema } = require('../schemas');

const prisma = new PrismaClient();

// 게시글 목록 조회
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, nickname: true }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        }
      }),
      prisma.post.count({ where })
    ]);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 검색 (/:id보다 먼저 정의)
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ message: '검색어를 입력해주세요' });
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
          ]
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, nickname: true }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        }
      }),
      prisma.post.count({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
          ]
        }
      })
    ]);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 게시글 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);

    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: '잘못된 게시글 ID 입니다' });
    }

    // 조회수 증가 — 없는 글이면 updateMany 는 0건 처리하고 넘어간다 (update 는 P2025 로 500 이 났음)
    const { count } = await prisma.post.updateMany({
      where: { id: postId },
      data: { viewCount: { increment: 1 } }
    });
    if (count === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, nickname: true }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, nickname: true }
            }
          }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다' });
    }

    // 현재 사용자의 좋아요 여부 확인
    let isLiked = false;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const like = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: decoded.userId,
              postId
            }
          }
        });
        isLiked = !!like;
      } catch (err) {
        // 토큰이 유효하지 않아도 게시글은 보여줌
      }
    }

    res.json({ ...post, isLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 게시글 작성
router.post('/', authMiddleware, validate(postSchema), async (req, res) => {
  try {
    const { title, content, category, imageUrl } = req.body;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        category,
        imageUrl,
        authorId: req.userId
      },
      include: {
        author: {
          select: { id: true, nickname: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 게시글 수정
router.put('/:id', authMiddleware, validate(postSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, imageUrl } = req.body;
    const postId = parseInt(id);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다' });
    }

    if (post.authorId !== req.userId) {
      return res.status(403).json({ message: '권한이 없습니다' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        category,
        imageUrl
      },
      include: {
        author: {
          select: { id: true, nickname: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 게시글 삭제
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다' });
    }

    if (post.authorId !== req.userId) {
      return res.status(403).json({ message: '권한이 없습니다' });
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    res.json({ message: '게시글이 삭제되었습니다' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 좋아요 토글
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: req.userId,
          postId
        }
      }
    });

    if (existingLike) {
      // 좋아요 취소
      await prisma.like.delete({
        where: {
          id: existingLike.id
        }
      });
      res.json({ liked: false });
    } else {
      // 좋아요 추가
      await prisma.like.create({
        data: {
          userId: req.userId,
          postId
        }
      });
      res.json({ liked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 댓글 작성
router.post('/:id/comments', authMiddleware, validate(commentSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const postId = parseInt(id);

    if (!content) {
      return res.status(400).json({ message: '댓글 내용을 입력해주세요' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: req.userId
      },
      include: {
        author: {
          select: { id: true, nickname: true }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 댓글 삭제
router.delete('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const commentIdInt = parseInt(commentId);

    const comment = await prisma.comment.findUnique({
      where: { id: commentIdInt }
    });

    if (!comment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다' });
    }

    if (comment.authorId !== req.userId) {
      return res.status(403).json({ message: '권한이 없습니다' });
    }

    await prisma.comment.delete({
      where: { id: commentIdInt }
    });

    res.json({ message: '댓글이 삭제되었습니다' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;