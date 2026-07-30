import { Router } from "express";
import TaskDocumentsController from "../controllers/taskDocuments.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UserRole } from "../constants/user-roles.js";
import multer from "multer";

const router = Router();

// Setup multer 
const upload = multer({
  dest: "uploads/", 
});

// GET /:taskId/documents
router.get(
  "/:taskId/documents",
  authMiddleware(UserRole.USER),
  TaskDocumentsController.getDocumentsForTask.bind(TaskDocumentsController)
);

// POST /:taskId/documents/upload
router.post(
  "/:taskId/documents/upload",
  authMiddleware(UserRole.USER),
  upload.single("file"), 
  TaskDocumentsController.uploadDocumentForTask.bind(TaskDocumentsController)
);

export default router;