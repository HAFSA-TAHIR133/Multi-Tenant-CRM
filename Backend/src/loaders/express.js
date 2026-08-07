// express.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { initOverdueTaskCron } from "../jobs/overdueChecker.js";
import '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const expressLoader = async ({ app }) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://multi-tenant-crm-8omk.vercel.app',
    'https://multi-tenant-crm-8omk-git-main-hafsa11.vercel.app'
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allows all during testing or enforce with: callback(new Error('Blocked by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'Accept']
  };

  // Enable CORS middleware
  app.use(cors(corsOptions));

  // Explicitly answer preflight OPTIONS requests across all endpoints
  app.options('*', cors(corsOptions));
    
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/status', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend Server is healthy!' });
  });

  // Initialize background cron worker only outside serverless environments
  if (process.env.NODE_ENV !== "production") {
    initOverdueTaskCron();
  }

  return app;
};

export default expressLoader;