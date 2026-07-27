import { Op } from 'sequelize';
import { Stage, Pipeline, User, PipelineAssignment } from '../models/index.js';
import { UserRole } from '../constants/user-roles.js';
import { ErrorCodesMeta } from '../constants/error-codes.js';

const StageService = {
  async createStage(data, user) {
    const { name, pipelineId, order = null, description = null, color = null, probability = null } = data;

    if (!name || !pipelineId) {
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

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only create stages in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      const err = new Error('Only admins can create stages');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return await Stage.create({
      tenantId: pipeline.tenantId,
      pipelineId,
      name,
      order,
      description,
      color,
      probability,
      createdBy: user.userId,
    });
  },

  async getAllStages(user) {
    if (user.role === UserRole.SUPERADMIN) {
      return await Stage.findAll({
        order: [['order', 'ASC'], ['createdAt', 'DESC']],
      });
    }

    if (user.role === UserRole.ADMIN) {
      return await Stage.findAll({
        where: { tenantId: user.tenantId },
        order: [['order', 'ASC'], ['createdAt', 'DESC']],
      });
    }

    const assignedPipelines = await PipelineAssignment.findAll({
      where: { userId: user.userId },
      attributes: ['pipelineId'],
      raw: true,
    });

    const pipelineIds = assignedPipelines.map((p) => p.pipelineId);

    if (!pipelineIds.length) return [];

    return await Stage.findAll({
      where: {
        pipelineId: { [Op.in]: pipelineIds },
      },
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
    });
  },

  async getStageById(id, user) {
    const stage = await Stage.findByPk(id, {
      include: [{ model: Pipeline, as: 'pipeline', required: true }],
    });

    if (!stage) {
      const err = new Error('Stage not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.SUPERADMIN) return stage;

    if (user.role === UserRole.ADMIN) {
      if (String(stage.tenantId) !== String(user.tenantId)) {
        const err = new Error('Admins can only access stages in their own tenant');
        err.code = ErrorCodesMeta.FORBIDDEN.code;
        throw err;
      }
      return stage;
    }

    const assignment = await PipelineAssignment.findOne({
      where: {
        userId: user.userId,
        pipelineId: stage.pipelineId,
      },
    });

    if (!assignment) {
      const err = new Error('Access denied: stage is not in your assigned pipelines');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    return stage;
  },

  async updateStage(id, data, user) {
    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      const err = new Error('Only admins can update stages');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const stage = await Stage.findByPk(id, {
      include: [{ model: Pipeline, as: 'pipeline', required: true }],
    });

    if (!stage) {
      const err = new Error('Stage not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(stage.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only update stages in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const { name, order, description, pipelineId, color, probability } = data;

    if (pipelineId !== undefined && pipelineId !== stage.pipelineId) {
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

      stage.pipelineId = newPipeline.id;
      stage.tenantId = newPipeline.tenantId;
    }

    await stage.update({
      name: name ?? stage.name,
      order: order ?? stage.order,
      description: description ?? stage.description,
      color: color ?? stage.color,
      probability: probability ?? stage.probability,
    });

    return stage;
  },

  async deleteStage(id, user) {
    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      const err = new Error('Only admins can delete stages');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const stage = await Stage.findByPk(id);
    if (!stage) {
      const err = new Error('Stage not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(stage.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only delete stages in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    await stage.destroy();
    return { success: true };
  },

  async reorderStages(pipelineId, stageIds, user) {
    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.ADMIN) {
      const err = new Error('Only admins can reorder stages');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const pipeline = await Pipeline.findByPk(pipelineId);
    if (!pipeline) {
      const err = new Error('Pipeline not found');
      err.code = ErrorCodesMeta.NOT_FOUND.code;
      throw err;
    }

    if (user.role === UserRole.ADMIN && String(pipeline.tenantId) !== String(user.tenantId)) {
      const err = new Error('Admins can only reorder stages in their own tenant');
      err.code = ErrorCodesMeta.FORBIDDEN.code;
      throw err;
    }

    const stages = await Stage.findAll({
      where: { pipelineId },
    });

    const idSet = new Set(stageIds.map(String));
    const stageSet = new Set(stages.map((s) => String(s.id)));

    if (stageIds.length !== stages.length || [...idSet].some((id) => !stageSet.has(id))) {
      const err = new Error('Stage order mismatch');
      err.code = ErrorCodesMeta.BAD_REQUEST.code;
      throw err;
    }

    for (let i = 0; i < stageIds.length; i += 1) {
      await Stage.update(
        { order: i + 1 },
        { where: { id: stageIds[i] } }
      );
    }

    return { success: true };
  },
};

export default StageService;