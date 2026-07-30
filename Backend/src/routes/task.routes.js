import { Router } from 'express';
import TaskController from '../controllers/task.controlller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../constants/user-roles.js';

const router = Router();

router.post('/',authMiddleware(UserRole.ADMIN),TaskController.createTask.bind(TaskController));

router.get('/',authMiddleware(UserRole.USER),TaskController.getAllTasks.bind(TaskController));

router.get('/:id',authMiddleware(UserRole.USER),TaskController.getTaskById.bind(TaskController));

router.put('/:id',authMiddleware(UserRole.USER),TaskController.updateTask.bind(TaskController));

router.delete('/:id',authMiddleware(UserRole.ADMIN),TaskController.deleteTask.bind(TaskController));

router.patch("/:id/stage",authMiddleware(UserRole.USER),TaskController.updateTaskStage.bind(TaskController));

export default router;