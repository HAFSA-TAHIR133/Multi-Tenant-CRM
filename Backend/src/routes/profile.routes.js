import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
} from "../controllers/profile.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { uploadSingleAvatar } from "../middleware/upload.js";

const profileRouter = Router();

profileRouter.get(
  "/",
  authMiddleware(),
  getProfile
);

profileRouter.put(
  "/",
  authMiddleware(),
  updateProfile
);

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