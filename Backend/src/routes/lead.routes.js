import { Router } from 'express';
import LeadController from '../controllers/lead.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../constants/user-roles.js';

const router = Router();

router.post('/',authMiddleware(UserRole.ADMIN),LeadController.createLead.bind(LeadController));

router.get('/',authMiddleware(UserRole.USER),LeadController.getAllLeads.bind(LeadController));

router.get('/:id',authMiddleware(UserRole.USER),LeadController.getLeadById.bind(LeadController));

router.put('/:id',authMiddleware(UserRole.USER),LeadController.updateLead.bind(LeadController));

router.delete('/:id',authMiddleware(UserRole.ADMIN),LeadController.deleteLead.bind(LeadController));

router.get('/:id/history',authMiddleware(UserRole.USER),LeadController.getLeadHistory.bind(LeadController));

export default router;