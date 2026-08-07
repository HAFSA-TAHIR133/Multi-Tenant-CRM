import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Task extends Model {}

  Task.init(
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
      modelName: 'Task',
      tableName: 'Tasks',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return Task;
};