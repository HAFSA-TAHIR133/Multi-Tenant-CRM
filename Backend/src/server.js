import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { unProtectedRouter, protectedRouter } from "./routes/index.js";
import postgresLoader from "./loaders/postgres.js";
import { initOverdueTaskCron, runOverdueTaskCheck } from "./jobs/overdueChecker.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://multi-tenant-crm-8omk.vercel.app",
  "https://multi-tenant-crm-8omk-git-main-hafsa11.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/multi-tenant-crm-.*\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-Id", "Accept"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Loader Middleware
app.use(async (req, res, next) => {
  try {
    await postgresLoader();
    next();
  } catch (err) {
    console.error("DB Connection Error:", err);
    next();
  }
});

// Root Route (Fixes the Vercel 404 on GET /)
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Multi-Tenant CRM Backend API is live and running!",
    timestamp: new Date().toISOString(),
  });
});

// Health check route
app.get("/status", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend is running!" });
});

// Trigger endpoint for Vercel Cron
app.get("/api/v1/cron/tasks", async (req, res) => {
  // Optional: Verify Vercel Cron header in production
  const authHeader = req.headers["authorization"];
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ success: false, message: "Unauthorized cron call" });
  }

  try {
    const result = await runOverdueTaskCheck();
    res.status(200).json({
      success: true,
      message: "Task check executed successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routers
app.use("/api/v1", unProtectedRouter);
app.use("/api/v1", protectedRouter);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start node cron for non-serverless local environments
if (!process.env.VERCEL) {
  initOverdueTaskCron();
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
}

export default app;