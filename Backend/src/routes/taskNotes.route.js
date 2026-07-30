import { Router } from "express";
import TaskNotesController from "../controllers/taskNotes.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserRole } from "../constants/user-roles.js";

const router = Router();

// GET /task/:taskId/notes
router.get(
  "/:taskId/notes",
  authMiddleware(UserRole.USER),
  TaskNotesController.getNotesForTask.bind(TaskNotesController)
);

// POST /task/:taskId/notes
router.post(
  "/:taskId/notes",
  authMiddleware(UserRole.USER),
  TaskNotesController.createNoteForTask.bind(TaskNotesController)
);

export default router;