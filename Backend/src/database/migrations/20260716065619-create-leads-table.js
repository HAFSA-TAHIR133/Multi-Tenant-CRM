import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('Leads', {
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
    pipelineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Pipelines', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    stageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Stages', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'open',
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
      onDelete: 'CASCADE',
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
  await queryInterface.dropTable('Leads');
}