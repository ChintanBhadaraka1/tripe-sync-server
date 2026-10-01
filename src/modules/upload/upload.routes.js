import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const router = Router();

// Configure Multer for local disk storage (for easy testing)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique name: uuid + original extension
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  
  // Return the public URL for the file
  const fileUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/uploads/${req.file.filename}`;
  // Wait, the file is hosted on the server. We should construct the URL based on the server's port.
  // Actually, relative path '/uploads/...' is safest, or full backend URL.
  const backendUrl = `http://localhost:${process.env.PORT || 5005}`;
  
  res.status(201).json({ 
    message: 'File uploaded successfully',
    url: `${backendUrl}/uploads/${req.file.filename}`,
    originalName: req.file.originalname
  });
});

export default router;
