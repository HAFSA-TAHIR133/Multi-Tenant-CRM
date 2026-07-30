/**
 * @typedef {Object} Task
 * @property {string|number} id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [status]
 * @property {string} [priority]
 * @property {string|null} [dueDate]
 * @property {number|null} [assignedUserId]
 * @property {number} leadId
 * @property {number} pipelineId
 * @property {number} stageId
 * @property {number} tenantId
 * @property {Object} [lead]
 * @property {Object} [assignedUser]
 * @property {Object} [stage]
 */

/**
 * @typedef {Object} Stage
 * @property {string|number} id
 * @property {string} name
 * @property {string} [color]
 * @property {number} pipelineId
 * @property {number} [order]
 */

/**
 * @typedef {Object} Pipeline
 * @property {string|number} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} tenantId
 */