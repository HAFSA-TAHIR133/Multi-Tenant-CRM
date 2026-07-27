import { Router } from 'express';
import StageController from '../controllers/stage.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../constants/user-roles.js';

const router = Router();

router.post('/', authMiddleware(UserRole.ADMIN), StageController.createStage.bind(StageController));
router.get('/', authMiddleware(UserRole.USER), StageController.getAllStages.bind(StageController));
router.get('/:id', authMiddleware(UserRole.USER), StageController.getStageById.bind(StageController));
router.put('/:id', authMiddleware(UserRole.ADMIN), StageController.updateStage.bind(StageController));
router.delete('/:id', authMiddleware(UserRole.ADMIN), StageController.deleteStage.bind(StageController));
router.post('/reorder', authMiddleware(UserRole.ADMIN), StageController.reorderStages.bind(StageController));

export default router;