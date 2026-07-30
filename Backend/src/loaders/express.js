import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const expressLoader = async ({ app }) => {
	app.use(cors({
		origin: 'http://localhost:5173',
		credentials: true                
	}));
	app.use(cookieParser());

	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	// const limiter = rateLimit({
	// 	windowMs: 15 * 60 * 1000, // 15 minutes
	// 	max: 100, // Limit each IP to 100 requests per windowMs
	// 	message: 'Too many requests from this IP, please try again later.',
	// 	standardHeaders: true,
	// 	legacyHeaders: false,
	// });
	// app.use(limiter);

	app.get('/status', (req, res) => {
		res.status(200).json({ status: 'OK', message: 'Backend Server is healthy!' });
	});


	// 6. Global Error Handling Middleware
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
