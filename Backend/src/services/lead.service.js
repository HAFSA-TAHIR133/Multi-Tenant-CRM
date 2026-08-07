import { Op } from 'sequelize';
import {
  Lead,
  LeadHistory,
  Pipeline,
  Stage,
  User,
  Tenant,
  Task,
  LeadDocument,
} from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';
import { uploadToCloudinary,deleteFromCloudinary } from '../utils/fileStorage.js';

// Standard reusable includes array for lead responses
const LEAD_INCLUDES = [
  { model: Pipeline, as: 'pipeline', required: true },
  { model: Stage, as: 'stage', required: true },
  {
    model: User,
    as: 'assignedUser',
    required: false,
    attributes: ['id', 'name', 'email', 'tenantId', 'role'],
  },
  {
    model: User,
    as: 'creator',
    required: false,
    attributes: ['id', 'name', 'email'],
  },
];

// Helper to reliably convert assignedUserId inputs to Integer or null
const parseAssignedUserId = (val) => {
  if (val === '' || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

const LeadService = {
  async createLead(data, user) {
    const {
      title,
      pipelineId,
      stageId,
      companyName,
      contactName,
      email,
      phone,
      website,
      value,
      source,
      status = 'open',
      assignedUserId,
    } = data;

    if (!title || !pipelineId || !stageId) {
      const err = new Error(ErrorCodesMeta.BAD_REQUEST.message);
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const pipeline = await Pipeline.findByPk(pipelineId);
    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    const stage = await Stage.findByPk(stageId);
    if (!stage) {
      const err = new Error('Stage not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (String(pipeline.tenantId) !== String(stage.tenantId)) {
      const err = new Error('Pipeline and stage must belong to the same tenant');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only create leads in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const finalTenantId = pipeline.tenantId;
    const parsedUserId = parseAssignedUserId(assignedUserId);

    if (parsedUserId !== null) {
      if (user.role === UserRole.USER) {
        const err = new Error('Users are not permitted to assign leads');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      const assignedUser = await User.findByPk(parsedUserId);
      if (!assignedUser) {
        const err = new Error('Assigned user not found');
        err.code = ErrorCodesMeta.NOT_FOUND.code;
        throw err;
      }
      if (String(assignedUser.tenantId) !== String(finalTenantId)) {
        const err = new Error('Assigned user must belong to the same tenant as the lead');
        err.code = ErrorCodesMeta.BAD_REQUEST.code;
        throw err;
      }
    }

    const lead = await Lead.create({
      tenantId: finalTenantId,
      pipelineId,
      stageId,
      title,
      companyName,
      contactName,
      email,
      phone,
      website,
      value,
      source,
      status,
      assignedUserId: parsedUserId,
      createdBy: user.userId || user.id,
      lastUpdatedBy: user.userId || user.id,
    });

    await this._logLeadHistory(
      lead.id,
      finalTenantId,
      user.userId || user.id,
      'CREATE',
      'lead',
      null,
      lead.toJSON(),
      'Lead created'
    );

    return await Lead.findByPk(lead.id, { include: LEAD_INCLUDES });
  },

  async getAllLeads(user) {
    const where = {};
    if (user.role === UserRole.SUPERADMIN) {
      // Superadmin accesses all leads
    } else if (user.role === UserRole.ADMIN) {
      where.tenantId = user.tenantId;
    } else if (user.role === UserRole.USER) {
      const currentUserId = user.userId || user.id;
      const taskLeadIds = await Task.findAll({
        where: { assignedUserId: currentUserId },
        attributes: ['leadId'],
        raw: true,
      });
      const taskAssignedLeadIds = [
        ...new Set(taskLeadIds.map((row) => row.leadId).filter(Boolean)),
      ];
      where[Op.or] = [
        { assignedUserId: currentUserId },
        ...(taskAssignedLeadIds.length > 0
          ? [{ id: { [Op.in]: taskAssignedLeadIds } }]
          : []),
      ];
    } else {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return await Lead.findAll({
      where,
      include: LEAD_INCLUDES,
      order: [['createdAt', 'DESC']],
    });
  },

  async getLeadById(id, user) {
    const lead = await Lead.findByPk(id, {
      include: [
        ...LEAD_INCLUDES,
        { 
          model: Tenant, 
          as: 'tenant', 
          required: false 
        },
      ],
    });

    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.SUPERADMIN) return lead;

    if (user.role === UserRole.ADMIN) {
      if (String(lead.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only access leads in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      return lead;
    }

    if (user.role === UserRole.USER) {
      const canAccess = await this._canAccessLead(lead, user);
      if (!canAccess) {
        const err = new Error('Access denied: lead is not assigned to you');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      return lead;
    }

    const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  },

  async updateLead(id, data, user) {
    const lead = await Lead.findByPk(id);
    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN) {
      if (String(lead.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only update leads in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role === UserRole.USER) {
      const canAccess = await this._canAccessLead(lead, user);
      if (!canAccess) {
        const err = new Error('Users can only update leads assigned to them');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role !== UserRole.SUPERADMIN) {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const {
      title,
      pipelineId,
      stageId,
      companyName,
      contactName,
      email,
      phone,
      website,
      value,
      source,
      status,
      assignedUserId,
    } = data;

    if (pipelineId !== undefined && String(pipelineId) !== String(lead.pipelineId)) {
      if (user.role === UserRole.USER) {
        const err = new Error('Users cannot change the pipeline of a lead');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      const newPipeline = await Pipeline.findByPk(pipelineId);
      if (!newPipeline) {
        const err = new Error('Pipeline not found');
        err.code = ErrorCodesMeta.NOT_FOUND.code;
        throw err;
      }
      if (user.role === UserRole.ADMIN && String(newPipeline.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only use pipelines in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      lead.pipelineId = newPipeline.id;
      lead.tenantId = newPipeline.tenantId;
    }

    if (stageId !== undefined && String(stageId) !== String(lead.stageId)) {
      const newStage = await Stage.findByPk(stageId);
      if (!newStage) {
        const err = new Error('Stage not found');
        err.code = ErrorCodesMeta.NOT_FOUND.code;
        throw err;
      }
      if (String(newStage.tenantId) !== String(lead.tenantId)) {
        const err = new Error('Stage must belong to the same tenant as the lead');
        err.code = ErrorCodesMeta.BAD_REQUEST.code;
        throw err;
      }
      lead.stageId = newStage.id;
    }

    const changes = [];
    const oldValues = lead.toJSON();

    if (title !== undefined && title !== lead.title) {
      lead.title = title;
      changes.push({ field: 'title', oldValue: oldValues.title, newValue: title });
    }
    if (companyName !== undefined && companyName !== lead.companyName) {
      lead.companyName = companyName;
      changes.push({ field: 'companyName', oldValue: oldValues.companyName, newValue: companyName });
    }
    if (contactName !== undefined && contactName !== lead.contactName) {
      lead.contactName = contactName;
      changes.push({ field: 'contactName', oldValue: oldValues.contactName, newValue: contactName });
    }
    if (email !== undefined && email !== lead.email) {
      lead.email = email;
      changes.push({ field: 'email', oldValue: oldValues.email, newValue: email });
    }
    if (phone !== undefined && phone !== lead.phone) {
      lead.phone = phone;
      changes.push({ field: 'phone', oldValue: oldValues.phone, newValue: phone });
    }
    if (website !== undefined && website !== lead.website) {
      lead.website = website;
      changes.push({ field: 'website', oldValue: oldValues.website, newValue: website });
    }
    if (value !== undefined && value !== lead.value) {
      lead.value = value;
      changes.push({ field: 'value', oldValue: oldValues.value, newValue: value });
    }
    if (source !== undefined && source !== lead.source) {
      lead.source = source;
      changes.push({ field: 'source', oldValue: oldValues.source, newValue: source });
    }
    if (status !== undefined && status !== lead.status) {
      lead.status = status;
      changes.push({ field: 'status', oldValue: oldValues.status, newValue: status });
    }

    if (assignedUserId !== undefined) {
      const parsedAssignedId = parseAssignedUserId(assignedUserId);

      if (parsedAssignedId !== lead.assignedUserId) {
        if (user.role === UserRole.USER) {
          const err = new Error('Users cannot change lead assignment');
          err.code = ErrorCodesMeta.FORBIDDEN.code;
          throw err;
        }

        if (parsedAssignedId !== null) {
          const targetUser = await User.findByPk(parsedAssignedId);
          if (!targetUser) {
            const err = new Error('Assigned user not found');
            err.code = ErrorCodesMeta.NOT_FOUND.code;
            throw err;
          }
          if (String(targetUser.tenantId) !== String(lead.tenantId)) {
            const err = new Error('Assigned user must belong to the same tenant as the lead');
            err.code = ErrorCodesMeta.BAD_REQUEST.code;
            throw err;
          }
        }

        changes.push({
          field: 'assignedUserId',
          oldValue: oldValues.assignedUserId,
          newValue: parsedAssignedId,
        });
        lead.assignedUserId = parsedAssignedId;
      }
    }

    const currentUserId = user.userId || user.id;
    lead.lastUpdatedBy = currentUserId;
    await lead.save();

    for (const change of changes) {
      await this._logLeadHistory(
        lead.id,
        lead.tenantId,
        currentUserId,
        'UPDATE',
        change.field,
        change.oldValue,
        change.newValue,
        `${change.field} changed`
      );
    }

    return await Lead.findByPk(lead.id, { include: LEAD_INCLUDES });
  },

  async assignLead(leadId, assignedUserId, user) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.USER) {
      const err = new Error('Users cannot assign leads');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(lead.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only assign leads in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const parsedUserId = parseAssignedUserId(assignedUserId);

    if (parsedUserId !== null) {
      const assignedUser = await User.findByPk(parsedUserId);
      if (!assignedUser) {
        const err = new Error('Assigned user not found');
        err.code = ErrorCodesMeta.NOT_FOUND.code;
        throw err;
      }
      if (String(assignedUser.tenantId) !== String(lead.tenantId)) {
        const err = new Error('Assigned user must belong to the same tenant as the lead');
        err.code = ErrorCodesMeta.BAD_REQUEST.code;
        throw err;
      }
    }

    const previousAssignedUserId = lead.assignedUserId;
    lead.assignedUserId = parsedUserId;
    const currentUserId = user.userId || user.id;
    lead.lastUpdatedBy = currentUserId;
    await lead.save();

    await this._logLeadHistory(
      lead.id,
      lead.tenantId,
      currentUserId,
      'UPDATE',
      'assignedUserId',
      previousAssignedUserId,
      lead.assignedUserId,
      'Lead assignee updated'
    );

    return await Lead.findByPk(lead.id, { include: LEAD_INCLUDES });
  },

  async deleteLead(id, user) {
    const lead = await Lead.findByPk(id);
    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(lead.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only delete leads in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      const err = new Error('Only admins can delete leads');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const currentUserId = user.userId || user.id;

    await this._logLeadHistory(
      lead.id,
      lead.tenantId,
      currentUserId,
      'DELETE',
      'lead',
      lead.toJSON(),
      null,
      'Lead deleted'
    );

    await lead.destroy();
    return { success: true };
  },

  async getLeadHistory(leadId, user) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.SUPERADMIN) {
      // allow
    } else if (user.role === UserRole.ADMIN) {
      if (String(lead.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only view history of leads in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role === UserRole.USER) {
      const canAccess = await this._canAccessLead(lead, user);
      if (!canAccess) {
        const err = new Error('Users can only view history of leads assigned to them');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const history = await LeadHistory.findAll({
      where: { leadId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'changedByUser',
          required: false,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    const stageIds = new Set();
    const pipelineIds = new Set();
    const targetUserIds = new Set();

    history.forEach((record) => {
      const target =
        record.fieldName === 'stageId'
          ? stageIds
          : record.fieldName === 'pipelineId'
          ? pipelineIds
          : record.fieldName === 'assignedUserId'
          ? targetUserIds
          : null;
      if (!target) return;
      [record.oldValue, record.newValue].forEach((value) => {
        const idValue = value && typeof value === 'object' ? value.id : value;
        if (idValue !== undefined && idValue !== null) target.add(String(idValue));
      });
    });

    const [stages, pipelines, users] = await Promise.all([
      stageIds.size > 0
        ? Stage.findAll({ where: { id: { [Op.in]: [...stageIds] } } })
        : Promise.resolve([]),
      pipelineIds.size > 0
        ? Pipeline.findAll({ where: { id: { [Op.in]: [...pipelineIds] } } })
        : Promise.resolve([]),
      targetUserIds.size > 0
        ? User.findAll({ where: { id: { [Op.in]: [...targetUserIds] } } })
        : Promise.resolve([]),
    ]);

    const stageNameById = new Map(stages.map((s) => [String(s.id), s.name]));
    const pipelineNameById = new Map(pipelines.map((p) => [String(p.id), p.name]));
    const userNameById = new Map(users.map((u) => [String(u.id), u.name]));

    return history.map((record) => {
      const plain = record.toJSON();
      const labelMap =
        record.fieldName === 'stageId'
          ? stageNameById
          : record.fieldName === 'pipelineId'
          ? pipelineNameById
          : record.fieldName === 'assignedUserId'
          ? userNameById
          : null;

      if (labelMap) {
        const resolveLabel = (value) => {
          if (value === undefined || value === null) return null;
          const idValue = value && typeof value === 'object' ? value.id : value;
          return labelMap.get(String(idValue)) || value;
        };
        plain.oldValueLabel = resolveLabel(record.oldValue);
        plain.newValueLabel = resolveLabel(record.newValue);
      }

      plain.user = plain.changedByUser
        ? {
            id: plain.changedByUser.id,
            name: plain.changedByUser.name,
            email: plain.changedByUser.email,
          }
        : null;
      return plain;
    });
  },

  async updateLeadStage(leadId, stageId, user) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(lead.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only update leads in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    } else if (user.role === UserRole.USER) {
      const canAccess = await this._canAccessLead(lead, user);
      if (!canAccess) {
        const err = new Error('Users can only update leads assigned to them');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (
      user.role !== UserRole.SUPERADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.USER
    ) {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const stage = await Stage.findByPk(stageId);
    if (!stage) {
      const err = new Error('Stage not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (String(stage.tenantId) !== String(lead.tenantId)) {
      const err = new Error('Stage must belong to the same tenant as the lead');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    const oldStageId = lead.stageId;
    const currentUserId = user.userId || user.id;
    lead.stageId = stageId;
    lead.lastUpdatedBy = currentUserId;
    await lead.save();

    await this._logLeadHistory(
      lead.id,
      lead.tenantId,
      currentUserId,
      'UPDATE',
      'stageId',
      oldStageId,
      stageId,
      'Lead stage changed'
    );

    return await Lead.findByPk(lead.id, { include: LEAD_INCLUDES });
  },

  async updateLeadStatus(leadId, status, user) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(lead.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only update leads in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    } else if (user.role === UserRole.USER) {
      const canAccess = await this._canAccessLead(lead, user);
      if (!canAccess) {
        const err = new Error('Users can only update leads assigned to them');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (
      user.role !== UserRole.SUPERADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.USER
    ) {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const oldStatus = lead.status;
    const currentUserId = user.userId || user.id;
    lead.status = status;
    lead.lastUpdatedBy = currentUserId;
    await lead.save();

    await this._logLeadHistory(
      lead.id,
      lead.tenantId,
      currentUserId,
      'UPDATE',
      'status',
      oldStatus,
      status,
      'Lead status changed'
    );

    return await Lead.findByPk(lead.id, { include: LEAD_INCLUDES });
  },

  async uploadLeadDocument(leadId, file, user) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    const canAccess = await this._canAccessLead(lead, user);
    if (!canAccess) {
      const err = new Error('Access denied to upload documents for this lead');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const currentUserId = user.userId || user.id;
    const cloudUrl = await uploadToCloudinary(
      file.path,
      `tenants/${lead.tenantId}/leads/${leadId}`
    );

    const doc = await LeadDocument.create({
      leadId,
      tenantId: lead.tenantId,
      name: file.originalname,
      url: cloudUrl,
      createdBy: currentUserId,
    });

    await this._logLeadHistory(
      lead.id,
      lead.tenantId,
      currentUserId,
      'UPDATE',
      'document',
      null,
      doc.id,
      `Document '${file.originalname}' uploaded`
    );

    return doc;
  },

  async getLeadDocuments(leadId, user) {
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    const canAccess = await this._canAccessLead(lead, user);
    if (!canAccess) {
      const err = new Error('Access denied to view documents for this lead');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return await LeadDocument.findAll({
      where: { leadId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  },

  async deleteDocumentForLead(leadId, documentId, user) {
  const lead = await Lead.findByPk(leadId);

  if (!lead) {
    const err = new Error('Lead not found');
    err.code = ErrorCodesMeta.NOT_FOUND.code;
    throw err;
  }

  // RBAC Validation
  if (user.role === UserRole.ADMIN) {
    if (String(lead.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only delete documents in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }
  } else if (user.role === UserRole.USER) {
    const err = new Error('Regular users are not allowed to delete lead documents');
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  } else if (user.role !== UserRole.SUPERADMIN) {
    const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
    err.code = ErrorCodesMeta.FORBIDDEN.code;
    throw err;
  }

  const document = await LeadDocument.findOne({
    where: { id: documentId, leadId, tenantId: lead.tenantId },
  });

  if (!document) {
    const err = new Error('Document not found');
    err.code = ErrorCodesMeta.NOT_FOUND.code;
    throw err;
  }

  // Delete from Cloudinary (helper handles raw/image/auto)
  await deleteFromCloudinary(document.url);

  // Remove from Database
  await document.destroy();
  return { message: 'Lead document deleted successfully' };
},

  async _canAccessLead(lead, user) {
    if (user.role === UserRole.SUPERADMIN) return true;
    if (user.role === UserRole.ADMIN) {
      return String(lead.tenantId) === String(user.tenantId);
    }
    if (user.role === UserRole.USER) {
      const currentUserId = user.userId || user.id;
      if (String(lead.assignedUserId || '') === String(currentUserId)) return true;
      const linkedTask = await Task.findOne({
        where: {
          leadId: lead.id,
          assignedUserId: currentUserId,
        },
      });
      return Boolean(linkedTask);
    }
    return false;
  },

  async _logLeadHistory(
    leadId,
    tenantId,
    changedBy,
    action,
    fieldName,
    oldValue,
    newValue,
    description
  ) {
    await LeadHistory.create({
      tenantId,
      leadId,
      changedBy,
      action,
      fieldName,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      description: description || `${action} on lead`,
    });
  },
};

export default LeadService;