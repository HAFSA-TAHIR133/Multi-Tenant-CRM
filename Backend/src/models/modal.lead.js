import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Lead extends Model {}

  Lead.init(
    {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
         allowNull: false,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pipelineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lastUpdatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'createdAt',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updatedAt',
      },
    },
    {
      sequelize,
      modelName: 'Lead',
      tableName: 'Leads',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return Lead;
};