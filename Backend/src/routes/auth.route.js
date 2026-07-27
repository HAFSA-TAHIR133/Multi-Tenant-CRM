import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserRole } from "../constants/user-roles.js";

const publicAuthRouter = Router();
const protectedAuthRouter = Router();

/* ==========================
   Public Routes
========================== */

publicAuthRouter.post(
  "/login",
  AuthController.login.bind(AuthController)
);

publicAuthRouter.post(
  "/refresh",
  AuthController.refreshAccessToken.bind(AuthController)
);

/**
 * Logout
 * Cookie based logout
 */
publicAuthRouter.post(
  "/logout",
  AuthController.logout.bind(AuthController)
);

publicAuthRouter.post(
  "/forgot-password",
  AuthController.forgotPassword.bind(AuthController)
);

publicAuthRouter.post(
  "/reset-password",
  AuthController.resetPassword.bind(AuthController)
);

/* ==========================
   Protected Routes
========================== */

protectedAuthRouter.post(
  "/users",
  authMiddleware(UserRole.ADMIN),
  AuthController.createUser.bind(AuthController)
);

protectedAuthRouter.post(
  "/logout-all",
  authMiddleware(UserRole.USER),
  AuthController.logoutAll.bind(AuthController)
);

export { publicAuthRouter, protectedAuthRouter };