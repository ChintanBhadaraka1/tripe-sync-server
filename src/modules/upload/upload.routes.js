import { Router } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const router = Router();

// 1. Configure Local Disk Storage (Fallback / Local Dev)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  }
});

// 2. Configure S3 Storage (Neon Object Storage)
let s3Storage = null;
if (process.env.USE_CLOUD_STORAGE === 'true') {
  const s3 = new S3Client({
    region: process.env.NEON_S3_REGION || 'us-east-1',
    endpoint: process.env.NEON_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.NEON_S3_ACCESS_KEY,
      secretAccessKey: process.env.NEON_S3_SECRET_KEY
    },
    // Required for S3 compatible providers to prevent subdomain routing issues
    forcePathStyle: true, 
  });

  s3Storage = multerS3({
    s3: s3,
    bucket: process.env.NEON_S3_BUCKET,
    // acl: 'public-read', // Uncomment if Neon requires explicit ACL for public reads
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `uploads/${randomUUID()}${ext}`);
    }
  });
}

// 3. Initialize Multer dynamically based on environment flag
const upload = multer({
  storage: process.env.USE_CLOUD_STORAGE === 'true' && s3Storage ? s3Storage : localStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  
  let fileUrl;
  
  // If uploaded to S3, multer-s3 automatically attaches the full URL to `req.file.location`
  if (process.env.USE_CLOUD_STORAGE === 'true' && req.file.location) {
    fileUrl = req.file.location;
  } else {
    // If local storage, build the backend URL
    const backendUrl = `http://localhost:${process.env.PORT || 5005}`;
    fileUrl = `${backendUrl}/uploads/${req.file.filename}`;
  }
  
  res.status(201).json({ 
    message: 'File uploaded successfully',
    url: fileUrl,
    originalName: req.file.originalname
  });
});

export default router;
