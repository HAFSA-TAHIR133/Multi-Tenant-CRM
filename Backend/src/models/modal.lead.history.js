import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class LeadHistory extends Model {}

  LeadHistory.init(
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
      leadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      changedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fieldName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      oldValue: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      newValue: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
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
      modelName: 'LeadHistory',
      tableName: 'LeadHistories',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return LeadHistory;
};