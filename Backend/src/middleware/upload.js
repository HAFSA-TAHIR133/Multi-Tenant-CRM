// src/middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { httpResponse } from '../utils/httpResponse.js';

const uploadDir = path.join(os.tmpdir(), 'uploads', 'temp');

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

// Existing Document Middleware (.single('file'))
const rawUploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single('file');

export const uploadSingleDocument = (req, res, next) => {
  rawUploadDocument(req, res, (err) => {
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
      return httpResponse.BAD_REQUEST(res, {}, err.message);
    }
    next();
  });
};

// Avatar Middleware (.single('avatar'))
const rawUploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for avatars."), false);
    }
  },
}).single("avatar");

export const uploadSingleAvatar = (req, res, next) => {
  rawUploadAvatar(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return httpResponse.BAD_REQUEST(
          res,
          {},
          "Avatar size exceeds maximum allowed limit of 5MB."
        );
      }
      return httpResponse.BAD_REQUEST(res, {}, err.message);
    }
    if (err) {
      return httpResponse.BAD_REQUEST(res, {}, err.message);
    }
    next();
  });
};