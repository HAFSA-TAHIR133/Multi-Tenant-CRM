import { Router } from 'express';
import LeadController from '../controllers/lead.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadSingleDocument } from '../middleware/upload.js';
import { UserRole } from '../constants/user-roles.js';

const router = Router();

router.post('/', authMiddleware(UserRole.ADMIN), LeadController.createLead.bind(LeadController));

router.get('/', authMiddleware(UserRole.USER), LeadController.getAllLeads.bind(LeadController));

router.get('/:id', authMiddleware(UserRole.USER), LeadController.getLeadById.bind(LeadController));

router.put('/:id', authMiddleware(UserRole.USER), LeadController.updateLead.bind(LeadController));

router.delete('/:id', authMiddleware(UserRole.ADMIN), LeadController.deleteLead.bind(LeadController));

router.get('/:id/history', authMiddleware(UserRole.USER), LeadController.getLeadHistory.bind(LeadController));

router.put('/:id/stage', authMiddleware(UserRole.USER), LeadController.updateLeadStage.bind(LeadController));

router.put('/:id/status', authMiddleware(UserRole.USER), LeadController.updateLeadStatus.bind(LeadController));

router.patch('/:id/assign', authMiddleware(UserRole.USER), LeadController.assignLead.bind(LeadController));

// File Upload & Retrieval Routes
router.get('/:id/documents', authMiddleware(UserRole.USER), LeadController.getLeadDocuments.bind(LeadController));

router.post(
  '/:id/documents/upload',
  authMiddleware(UserRole.USER),
  uploadSingleDocument,
  LeadController.uploadLeadDocument.bind(LeadController)
);

// Delete Lead Document Route (Restricted to ADMIN)
router.delete(
  '/:id/documents/:documentId',
  authMiddleware(UserRole.ADMIN),
  LeadController.deleteDocumentForLead.bind(LeadController)
);

export default router;