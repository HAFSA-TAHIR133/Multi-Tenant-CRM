// src/middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { httpResponse } from '../utils/httpResponse.js';

// Ensure temp upload folder exists
const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const rawUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  // no fileFilter → accept all types
}).single('file'); // field name must be "file"

export const uploadSingleDocument = (req, res, next) => {
  rawUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return httpResponse.BAD_REQUEST(
          res,
          {},
          'File size exceeds maximum allowed limit of 10MB.'
        );
      }
      return httpResponse.BAD_REQUEST(res, {}, err.message);
    }
    if (err) {
      console.error('Multer error:', err);
      return httpResponse.BAD_REQUEST(res, {}, err.message);
    }
    next();
  });
};