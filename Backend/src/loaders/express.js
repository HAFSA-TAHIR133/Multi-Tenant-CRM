import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { initOverdueTaskCron } from "../jobs/overdueChecker.js";
import '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const expressLoader = async ({ app }) => {
    // Dynamic CORS to allow both local development and live production URLs
    const allowedOrigins = [
        'http://localhost:5173',
        process.env.CLIENT_URL, // Add your frontend live domain in .env (e.g., https://your-app.vercel.app)
    ].filter(Boolean);

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, true); // Or set to callback(new Error('Not allowed by CORS')) to strictly block
            }
        },
        credentials: true                
    }));
    
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/status', (req, res) => {
        res.status(200).json({ status: 'OK', message: 'Backend Server is healthy!' });
    });

    // Initialize background cron worker on server start
    initOverdueTaskCron();

    // Global Error Handling Middleware
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        });
    });

    return app;
};

export default expressLoader;