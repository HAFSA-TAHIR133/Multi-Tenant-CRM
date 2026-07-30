import { Router } from "express";
import TaskCommentsController from "../controllers/taskComments.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserRole } from "../constants/user-roles.js";

const router = Router();

router.get(
  "/:taskId/comments",authMiddleware(UserRole.USER),
  TaskCommentsController.getCommentsForTask.bind(TaskCommentsController));

router.post(
  "/:taskId/comments",authMiddleware(UserRole.USER),
  TaskCommentsController.createCommentForTask.bind(TaskCommentsController)
);

export default router;