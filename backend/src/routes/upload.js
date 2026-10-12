const router = require('express').Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const authMiddleware = require('../middleware/auth');

// uploads 디렉토리 확인 및 생성
const uploadsDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다'));
    }
  }
});

// 이미지 업로드
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '이미지 파일을 선택해주세요' });
    }

    // 파일명 생성
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Sharp로 이미지 처리
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // 썸네일 생성
    const thumbnailFilename = `thumb-${filename}`;
    const thumbnailPath = path.join(uploadsDir, thumbnailFilename);

    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover'
      })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    res.json({
      url: `/uploads/${filename}`,
      thumbnailUrl: `/uploads/${thumbnailFilename}`,
      filename
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '이미지 업로드 중 오류가 발생했습니다' });
  }
});

// 여러 이미지 업로드
router.post('/multiple', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '이미지 파일을 선택해주세요' });
    }

    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(uploadsDir, filename);

        await sharp(file.buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(filepath);

        return {
          url: `/uploads/${filename}`,
          filename
        };
      })
    );

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '이미지 업로드 중 오류가 발생했습니다' });
  }
});

module.exports = router;