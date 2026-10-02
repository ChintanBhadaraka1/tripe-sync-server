import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const router = Router();

// S3 Client Setup
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  forcePathStyle: true, 
});

// Use MemoryStorage so we can process files with Sharp before saving
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let fileBuffer = req.file.buffer;
    let filename = randomUUID();
    let mimeType = req.file.mimetype;
    let ext = path.extname(req.file.originalname).toLowerCase();
    
    // Check if image (excluding SVGs and GIFs which sharp can break or freeze on)
    const isImage = mimeType.startsWith('image/') && !['image/svg+xml', 'image/gif'].includes(mimeType);

    // Compress with Sharp if it's an image
    if (isImage) {
      fileBuffer = await sharp(req.file.buffer)
        .resize({ width: 1080, withoutEnlargement: true }) // Max width 1080px
        .webp({ quality: 80 }) // Convert to WebP format with 80% quality
        .toBuffer();
      
      ext = '.webp';
      mimeType = 'image/webp';
    }

    filename = `${filename}${ext}`;

    let fileUrl;

    if (process.env.USE_CLOUD_STORAGE === 'true') {
      // 1. Upload to Neon S3
      const bucketName = process.env.AWS_S3_BUCKET || 'default';
      const key = `uploads/${filename}`;
      
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType
      }));

      // Build the S3 URL
      const baseEndpoint = (process.env.AWS_ENDPOINT_URL_S3 || '').replace(/\/$/, "");
      fileUrl = `${baseEndpoint}/${bucketName}/${key}`;
    } else {
      // 2. Save locally
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, fileBuffer);
      
      const backendUrl = `http://localhost:${process.env.PORT || 5005}`;
      fileUrl = `${backendUrl}/uploads/${filename}`;
    }

    res.status(201).json({ 
      message: 'File uploaded successfully',
      url: fileUrl,
      originalName: req.file.originalname
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
});

export default router;
