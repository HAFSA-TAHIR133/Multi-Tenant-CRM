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
  // Define explicit allowed origins
  const allowedOrigins = [
    'http://localhost:5173',
    'https://multi-tenant-crm-8omk.vercel.app',
    'https://multi-tenant-crm-8omk-git-main-hafsa11.vercel.app',
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Check exact match or any Vercel deployment preview URL pattern for this project
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/multi-tenant-crm-[a-z0-9-]+-hafsa11\.vercel\.app$/.test(origin) ||
        origin === process.env.CLIENT_URL;

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'Accept'],
  };

  app.use(cors(corsOptions));
  
  // Handle preflight requests for all endpoints
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