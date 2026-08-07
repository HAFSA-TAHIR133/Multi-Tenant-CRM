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

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to lazily initialize Postgres connection per request without crashing boot
app.use(async (req, res, next) => {
  try {
    await postgresLoader();
    next();
  } catch (err) {
    console.error("Database connection error on invocation:", err);
    next(); // Pass to routes/middleware even if DB has an issue to avoid total function crash
  }
});

// Health check endpoint
app.get("/status", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend is running!" });
});

// Mount Routers
app.use("/api/v1", unProtectedRouter);
app.use("/api/v1", protectedRouter);

// JSON 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(5000, () => console.log("Server running on port 5000"));
}

export default app;