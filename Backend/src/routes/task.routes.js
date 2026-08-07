import { Router } from 'express';
import TaskController from '../controllers/task.controlller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadSingleDocument } from '../middleware/upload.js';
import { UserRole } from '../constants/user-roles.js';

const router = Router();

router.post('/', authMiddleware(UserRole.ADMIN), TaskController.createTask.bind(TaskController));
router.get('/', authMiddleware(UserRole.USER), TaskController.getAllTasks.bind(TaskController));
router.get('/:id', authMiddleware(UserRole.USER), TaskController.getTaskById.bind(TaskController));
router.put('/:id', authMiddleware(UserRole.USER), TaskController.updateTask.bind(TaskController));
router.delete('/:id', authMiddleware(UserRole.ADMIN), TaskController.deleteTask.bind(TaskController));

// Document Routes
router.get('/:id/documents', authMiddleware(UserRole.USER), TaskController.getTaskDocuments.bind(TaskController));
router.post(
  '/:id/documents/upload',
  authMiddleware(UserRole.USER),
  uploadSingleDocument,
  TaskController.uploadTaskDocument.bind(TaskController)
);

// Delete Task Document Route (Restricted to ADMIN)
router.delete(
  '/:id/documents/:documentId',
  authMiddleware(UserRole.ADMIN),
  TaskController.deleteDocumentForTask.bind(TaskController)
);

export default router;