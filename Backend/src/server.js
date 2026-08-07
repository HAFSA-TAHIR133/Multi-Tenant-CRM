import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { unProtectedRouter, protectedRouter } from "./routes/index.js";
import postgresLoader from "./loaders/postgres.js";

const app = express();

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
  allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-Id", "Accept"],
  optionsSuccessStatus: 200
};

// Enable CORS for ALL routes & preflights automatically
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lazily connect DB per invocation without crashing app startup
app.use(async (req, res, next) => {
  try {
    await postgresLoader();
    next();
  } catch (err) {
    console.error("DB Connection Error:", err);
    next();
  }
});

// Health check route
app.get("/status", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend is running!" });
});

// Routers
app.use("/api/v1", unProtectedRouter);
app.use("/api/v1", protectedRouter);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(5000, () => console.log("Server running on port 5000"));
}

export default app;