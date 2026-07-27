import { Op } from 'sequelize';
import {
  Lead,
  LeadHistory,
  Pipeline,
  Stage,
  User,
  Tenant,
} from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

const LeadService = {
  async createLead(data, user) {
    const {title,pipelineId,stageId,tenantId,companyName,contactName,email,phone,
            website,value,source,status = 'open',assignedUserId,
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
      assignedUserId: assignedUserId ?? null,
      createdBy: user.userId,
      lastUpdatedBy: user.userId,
    });

    await this._logLeadHistory(
      lead.id,
      finalTenantId,
      user.userId,
      'CREATE',
      'lead',
      null,
      lead.toJSON(),
      'Lead created'
    );

    return lead;
  },

  async getAllLeads(user) {
    const where = {};
    const include = [
      { model: Pipeline, as: 'pipeline', required: true },
      { model: Stage, as: 'stage', required: true },
      { model: User, as: 'assignedUser', required: false },
    ];

    if (user.role === UserRole.SUPERADMIN) {
      // no tenant filter
    } 
    else if (user.role === UserRole.ADMIN) {
      where.tenantId = user.tenantId;
    } 
    else if (user.role === UserRole.USER) {
      where.assignedUserId = user.userId;
    } 
    else {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return await Lead.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });
  },

  async getLeadById(id, user) {
    const lead = await Lead.findByPk(id, {
      include: [
        { model: Pipeline, as: 'pipeline', required: true },
        { model: Stage, as: 'stage', required: true },
        { model: User, as: 'assignedUser', required: false },
        { model: Tenant, as: 'tenant', required: false },
      ],
    });

    if (!lead) {
      const err = new Error('Lead not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.SUPERADMIN) {
      return lead;
    }

    if (user.role === UserRole.ADMIN) {
      if (String(lead.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only access leads in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      return lead;
    }

    if (user.role === UserRole.USER) {
      if (String(lead.assignedUserId || '') !== String(user.userId)) {
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
    } 
    else if (user.role === UserRole.USER) {
      if (String(lead.assignedUserId || '') !== String(user.userId)) {
        const err = new Error('Users can only update leads assigned to them');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } 
    else if (user.role !== UserRole.SUPERADMIN) {
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

    const fieldsToUpdate = {
      title,
      pipelineId: lead.pipelineId,
      stageId: lead.stageId,
      companyName,
      contactName,
      email,
      phone,
      website,
      value,
      source,
      status,
      assignedUserId,
    };

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
    if (assignedUserId !== undefined && assignedUserId !== lead.assignedUserId) {
      lead.assignedUserId = assignedUserId;
      changes.push({ field: 'assignedUserId', oldValue: oldValues.assignedUserId, newValue: assignedUserId });
    }

    lead.lastUpdatedBy = user.userId;
    await lead.save();

    // Log history for each changed field
    for (const change of changes) {
      await this._logLeadHistory(
        lead.id,
        lead.tenantId,
        user.userId,
        'UPDATE',
        change.field,
        change.oldValue,
        change.newValue,
        `${change.field} changed`
      );
    }

    return await Lead.findByPk(lead.id, {
      include: [
        { model: Pipeline, as: 'pipeline', required: true },
        { model: Stage, as: 'stage', required: true },
        { model: User, as: 'assignedUser', required: false },
      ],
    });
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

    await this._logLeadHistory(
      lead.id,
      lead.tenantId,
      user.userId,
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
      // allow all
    } else if (user.role === UserRole.ADMIN) {
      if (String(lead.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only view history of leads in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else if (user.role === UserRole.USER) {
      if (String(lead.assignedUserId || '') !== String(user.userId)) {
        const err = new Error('Users can only view history of leads assigned to them');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
    } else {
      const err = new Error(ErrorCodesMeta.FORBIDDEN.message);
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return await LeadHistory.findAll({
      where: { leadId },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'changedByUser', required: false }],
    });
  },

  async _logLeadHistory(leadId, tenantId, changedBy, action, fieldName, oldValue, newValue, description) {
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