import { Router } from 'express';
import PipelineController from '../controllers/pipeline.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../constants/user-roles.js';

const router = Router();

router.post('/', authMiddleware(UserRole.ADMIN), PipelineController.createPipeline.bind(PipelineController));
router.get('/', authMiddleware(UserRole.USER), PipelineController.getAllPipelines.bind(PipelineController));
router.get('/:id', authMiddleware(UserRole.USER), PipelineController.getPipelineById.bind(PipelineController));
router.put('/:id', authMiddleware(UserRole.ADMIN), PipelineController.updatePipeline.bind(PipelineController));
router.delete('/:id', authMiddleware(UserRole.ADMIN), PipelineController.deletePipeline.bind(PipelineController));

router.get('/:id/stages', authMiddleware(UserRole.USER), PipelineController.getPipelineStages.bind(PipelineController));
router.get('/:id/leads', authMiddleware(UserRole.USER), PipelineController.getPipelineLeads.bind(PipelineController));
router.post('/:id/assign-lead',authMiddleware(UserRole.ADMIN),PipelineController.assignLeadToPipeline.bind(PipelineController));
export default router;