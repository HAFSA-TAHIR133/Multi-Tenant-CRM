import { Sequelize } from 'sequelize';
import pg from 'pg';
import config from '../config/index.js';

import { sequelize } from '../loaders/postgres.js';

import Tenant from './tenant.modal.js';
import User from './user.model.js';
import Profile from './profile.modal.js';
import Pipeline from './pipeline.modal.js';
import Stage from './stage.modal.js';
import Lead from './modal.lead.js';
import LeadHistory from './modal.lead.history.js';
import PipelineAssignment from './pipeline-assignment.modal.js';
import RefreshToken from './refresh-token-modal.js';
import Task from './task.modal.js';
import TaskDocumentModel from './taskDocument.model.js';
import taskCommentModel from './taskComment.model.js';
import LeadDocumentModel from './leadDocument.model.js';

// Resolve database URL or explicit options
// const dbUrl = config?.databaseUrl || process.env.DATABASE_URL;

// const sequelize = dbUrl
//   ? new Sequelize(dbUrl, {
//       dialect: "postgres",
//       dialectModule: pg,
//       logging: false,
//       dialectOptions: {
//         ssl: {
//           require: true,
//           rejectUnauthorized: false,
//         },
//       },
//     })
//   : new Sequelize(
//       process.env.DB_NAME,
//       process.env.DB_USER,
//       process.env.DB_PASSWORD,
//       {
//         host: process.env.DB_HOST || "localhost",
//         port: process.env.DB_PORT || 5432,
//         dialect: "postgres",
//         dialectModule: pg,
//         logging: false,
//       }
//     );

// Initialize Models
const TenantModel = Tenant(sequelize);
const UserModel = User(sequelize);
const ProfileModel = Profile(sequelize);
const PipelineModel = Pipeline(sequelize);
const StageModel = Stage(sequelize);
const LeadModel = Lead(sequelize);
const LeadHistoryModel = LeadHistory(sequelize);
const PipelineAssignmentModel = PipelineAssignment(sequelize);
const RefreshTokenModel = RefreshToken(sequelize);
const TaskModal = Task(sequelize);
const TaskDocument = TaskDocumentModel(sequelize);
const TaskComment = taskCommentModel(sequelize);
const LeadDocument = LeadDocumentModel(sequelize);

// --- ASSOCIATIONS ---

// Tenant ↔ Users (Add onDelete: 'CASCADE')
TenantModel.hasMany(UserModel, { 
  foreignKey: 'tenantId', 
  as: 'users', 
  onDelete: 'CASCADE' 
});
UserModel.belongsTo(TenantModel, { 
  foreignKey: 'tenantId', 
  as: 'tenant', 
  onDelete: 'CASCADE' 
});

// User ↔ Profile
UserModel.hasOne(ProfileModel, { foreignKey: 'userId', as: 'profile' });
ProfileModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

// User ↔ Leads (assignedTo)
UserModel.hasMany(LeadModel, { foreignKey: 'assignedUserId', as: 'assignedLeads' });
LeadModel.belongsTo(UserModel, { foreignKey: 'assignedUserId', as: 'assignedUser' });

// Tenant ↔ Pipelines
TenantModel.hasMany(PipelineModel, { foreignKey: 'tenantId', as: 'pipelines', onDelete: 'CASCADE' });
PipelineModel.belongsTo(TenantModel, { foreignKey: 'tenantId', as: 'tenant', onDelete: 'CASCADE' });

// Pipeline ↔ Stages
PipelineModel.hasMany(StageModel, { foreignKey: 'pipelineId', as: 'stages' });
StageModel.belongsTo(PipelineModel, { foreignKey: 'pipelineId', as: 'pipeline' });

// Tenant ↔ Stages
TenantModel.hasMany(StageModel, { foreignKey: 'tenantId', as: 'stagesDirect', onDelete: 'CASCADE' });
StageModel.belongsTo(TenantModel, { foreignKey: 'tenantId', as: 'tenantDirect', onDelete: 'CASCADE' });

// Tenant ↔ Leads
TenantModel.hasMany(LeadModel, { foreignKey: 'tenantId', as: 'leads', onDelete: 'CASCADE' });
LeadModel.belongsTo(TenantModel, { foreignKey: 'tenantId', as: 'tenant', onDelete: 'CASCADE' });

// Stage ↔ Leads
StageModel.hasMany(LeadModel, { foreignKey: 'stageId', as: 'leads' });
LeadModel.belongsTo(StageModel, { foreignKey: 'stageId', as: 'stage' });

// Pipeline ↔ Leads
PipelineModel.hasMany(LeadModel, { foreignKey: 'pipelineId', as: 'leads' });
LeadModel.belongsTo(PipelineModel, { foreignKey: 'pipelineId', as: 'pipeline' });

// Tenant ↔ LeadHistories
TenantModel.hasMany(LeadHistoryModel, { foreignKey: 'tenantId', as: 'leadHistories', onDelete: 'CASCADE' });
LeadHistoryModel.belongsTo(TenantModel, { foreignKey: 'tenantId', as: 'tenant', onDelete: 'CASCADE' });

// Lead ↔ LeadHistories
LeadModel.hasMany(LeadHistoryModel, { foreignKey: 'leadId', as: 'histories' });
LeadHistoryModel.belongsTo(LeadModel, { foreignKey: 'leadId', as: 'lead' });

// User ↔ LeadHistories (changedBy)
UserModel.hasMany(LeadHistoryModel, { foreignKey: 'changedBy', as: 'changedHistories' });
LeadHistoryModel.belongsTo(UserModel, { foreignKey: 'changedBy', as: 'changedByUser' });

// Lead ↔ User (createdBy, lastUpdatedBy)
UserModel.hasMany(LeadModel, { foreignKey: 'createdBy', as: 'createdLeads' });
LeadModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

UserModel.hasMany(LeadModel, { foreignKey: 'lastUpdatedBy', as: 'updatedLeads' });
LeadModel.belongsTo(UserModel, { foreignKey: 'lastUpdatedBy', as: 'updater' });

// User ↔ RefreshTokens
UserModel.hasMany(RefreshTokenModel, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshTokenModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

// --- TASK ASSOCIATIONS ---
// Tenant ↔ Tasks
TenantModel.hasMany(TaskModal, { foreignKey: 'tenantId', as: 'tasks', onDelete: 'CASCADE' });
TaskModal.belongsTo(TenantModel, { foreignKey: 'tenantId', as: 'tenant', onDelete: 'CASCADE' });

// Task ↔ Lead
LeadModel.hasMany(TaskModal, { foreignKey: 'leadId', as: 'tasks' });
TaskModal.belongsTo(LeadModel, { foreignKey: 'leadId', as: 'lead' });

// Task ↔ User (Assigned / Created / Updated)
UserModel.hasMany(TaskModal, { foreignKey: 'assignedUserId', as: 'assignedTasks' });
TaskModal.belongsTo(UserModel, { foreignKey: 'assignedUserId', as: 'assignedUser' });

UserModel.hasMany(TaskModal, { foreignKey: 'createdBy', as: 'createdTasks' });
TaskModal.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

UserModel.hasMany(TaskModal, { foreignKey: 'lastUpdatedBy', as: 'updatedTasks' });
TaskModal.belongsTo(UserModel, { foreignKey: 'lastUpdatedBy', as: 'updater' });

// Task ↔ TaskDocument / TaskComment
TaskModal.hasMany(TaskDocument, { foreignKey: 'taskId', as: 'documents' });
TaskDocument.belongsTo(TaskModal, { foreignKey: 'taskId', as: 'task' });

TaskModal.hasMany(TaskComment, { foreignKey: 'taskId', as: 'comments' });
TaskComment.belongsTo(TaskModal, { foreignKey: 'taskId', as: 'task' });

UserModel.hasMany(TaskComment, { foreignKey: 'userId', as: 'taskComments' });
TaskComment.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

UserModel.hasMany(TaskDocument, { foreignKey: 'createdBy', as: 'createdDocuments' });
TaskDocument.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

// --- LEAD DOCUMENT ASSOCIATIONS ---
LeadModel.hasMany(LeadDocument, { foreignKey: 'leadId', as: 'documents' });
LeadDocument.belongsTo(LeadModel, { foreignKey: 'leadId', as: 'lead' });

UserModel.hasMany(LeadDocument, { foreignKey: 'createdBy', as: 'createdLeadDocuments' });
LeadDocument.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

export {
  sequelize,
  TenantModel as Tenant,
  UserModel as User,
  ProfileModel as Profile,
  PipelineModel as Pipeline,
  StageModel as Stage,
  LeadModel as Lead,
  LeadHistoryModel as LeadHistory,
  RefreshTokenModel as RefreshToken,
  PipelineAssignmentModel as PipelineAssignment,
  TaskModal as Task,
  TaskDocument,
  TaskComment,
  LeadDocument,
};