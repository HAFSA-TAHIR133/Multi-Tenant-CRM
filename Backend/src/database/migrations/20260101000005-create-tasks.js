import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('Tasks', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Tenants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Leads', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    pipelineId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Pipelines', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    stageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Stages', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assignedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    lastUpdatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Tasks');
}