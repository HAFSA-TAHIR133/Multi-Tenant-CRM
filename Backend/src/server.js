import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { unProtectedRouter, protectedRouter } from "./routes/index.js";
import postgresLoader from "./loaders/postgres.js";

const app = express();

// 1. Explicitly enable CORS at the root level before any routes
const allowedOrigins = [
  "http://localhost:5173",
  "https://multi-tenant-crm-8omk.vercel.app",
  "https://multi-tenant-crm-8omk-git-main-hafsa11.vercel.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^https:\/\/multi-tenant-crm-.*\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-Id", "Accept"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Health check route
app.get("/status", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend is running!" });
});

// 3. Connect DB asynchronously without blocking serverless function boot
postgresLoader().catch((err) => console.error("DB Connection Error:", err));

// 4. Mount Routers directly
app.use("/api/v1", unProtectedRouter);
app.use("/api/v1", protectedRouter);

// 5. Explicit 404 JSON response (prevents HTML 404 pages)
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Local dev listener
if (process.env.NODE_ENV !== "production") {
  app.listen(5000, () => console.log("Server running on port 5000"));
}

export default app;