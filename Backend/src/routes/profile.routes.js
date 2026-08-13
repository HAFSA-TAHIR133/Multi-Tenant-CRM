import express from "express";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
} from "../controllers/profile.controller.js";
import { uploadSingleAvatar } from "../middleware/upload.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const profileRouter = express.Router();

// Omit requiredRole argument so authMiddleware only checks valid token authentication
profileRouter.get("/", authMiddleware(), getProfile);
profileRouter.put("/", authMiddleware(), updateProfile);
profileRouter.post(
  "/avatar",
  authMiddleware(),
  uploadSingleAvatar,
  uploadAvatar
);
profileRouter.put(
  "/change-password",
  authMiddleware(),
  changePassword
);

export default profileRouter;