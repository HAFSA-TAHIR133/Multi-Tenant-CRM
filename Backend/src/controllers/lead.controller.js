import LeadService from '../services/lead.service.js';
import { httpResponse } from '../utils/httpResponse.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { sendEmail } from '../utils/email.js';
import { User,LeadDocument } from '../models/index.js';

class LeadController {
  async createLead(req, res) {
    try {
      const result = await LeadService.createLead(req.body, req.user);

      const { assignedUserId, title, name } = req.body;

      if (assignedUserId) {
        const assignedUser = await User.findByPk(Number(assignedUserId));

        if (assignedUser?.email) {
          await sendEmail({
            to: assignedUser.email,
            subject: `New Lead Assigned: ${title || name || 'Untitled Lead'}`,
            html: `
              <p>Hello ${assignedUser.name || 'there'},</p>
              <p>You have been assigned to a new lead: <strong>${title || name || 'Untitled Lead'}</strong>.</p>
            `,
          });
        }
      }

      return httpResponse.CREATED(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async getAllLeads(req, res) {
    try {
      const result = await LeadService.getAllLeads(req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }

  async getLeadById(req, res) {
    try {
      const result = await LeadService.getLeadById(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }

  async updateLead(req, res) {
    try {
      const result = await LeadService.updateLead(req.params.id, req.body, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async assignLead(req, res) {
    try {
      const { id } = req.params;
      const { assignedUserId } = req.body;
      const result = await LeadService.assignLead(id, assignedUserId, req.user);
      return httpResponse.SUCCESS(res, result, 'Lead assigned successfully');
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async deleteLead(req, res) {
    try {
      const result = await LeadService.deleteLead(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result, 'Lead deleted successfully');
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }

  async getLeadHistory(req, res) {
    try {
      const result = await LeadService.getLeadHistory(req.params.id, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }

  async updateLeadStage(req, res) {
    try {
      const { id } = req.params;
      const { stageId } = req.body;
      const result = await LeadService.updateLeadStage(id, stageId, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async updateLeadStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await LeadService.updateLeadStatus(id, status, req.user);
      return httpResponse.SUCCESS(res, result);
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

    async uploadLeadDocument(req, res) {
    try {
      if (!req.file) {
        return httpResponse.BAD_REQUEST(res, {}, 'No file uploaded.');
      }

      const result = await LeadService.uploadLeadDocument(req.params.id, req.file, req.user);

      // Add file type info for frontend preview logic
      const fileExt = req.file.originalname.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
      const isPdf = fileExt === 'pdf';
      const canPreview = isImage || isPdf;

      const responseData = {
        ...result.toJSON?.() ?? result,
        canPreview,
        fileType: isImage ? 'image' : isPdf ? 'pdf' : 'other',
      };

      return httpResponse.CREATED(res, responseData, 'Document uploaded successfully');
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(
        res,
        {},
        error.message || ErrorCodesMeta.BAD_REQUEST.message
      );
    }
  }

  async getLeadDocuments(req, res) {
    try {
      const documents = await LeadService.getLeadDocuments(req.params.id, req.user);

      // Add preview flags for frontend
      const documentsWithPreview = documents.map((doc) => {
        const plain = doc.toJSON?.() ?? doc;
        const fileExt = (plain.name || '').split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
        const isPdf = fileExt === 'pdf';
        const canPreview = isImage || isPdf;

        return {
          ...plain,
          canPreview,
          previewUrl: canPreview ? plain.url : null,
          fileType: isImage ? 'image' : isPdf ? 'pdf' : 'other',
        };
      });

      // ✅ Use SUCCESS (not OK)
      return httpResponse.SUCCESS(res, documentsWithPreview, 'Documents retrieved successfully');
    } catch (error) {
      console.error('Error fetching lead documents:', error);
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.BAD_REQUEST(res, {}, error.message || 'Failed to fetch documents');
    }
  }

  async deleteDocumentForLead(req, res) {
    try {
      // ✅ Route is /:id/documents/:documentId → params are id + documentId
      const { id, documentId } = req.params;

      const result = await LeadService.deleteDocumentForLead(
        id,
        documentId,
        req.user
      );

      return httpResponse.SUCCESS(res, result, 'Document deleted successfully');
    } catch (error) {
      if (error.code === ErrorCodesMeta.NOT_FOUND.code) {
        return httpResponse.NOT_FOUND(res, {}, error.message);
      }
      if (error.code === ErrorCodesMeta.FORBIDDEN.code) {
        return httpResponse.FORBIDDEN(res, {}, error.message);
      }
      return httpResponse.INTERNAL_SERVER_ERROR(
        res,
        {},
        error.message || ErrorCodesMeta.INTERNAL_SERVER_ERROR.message
      );
    }
  }
}

export default new LeadController();