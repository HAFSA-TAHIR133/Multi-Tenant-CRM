import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class PipelineAssignment extends Model {}

  PipelineAssignment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      pipelineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      assignedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      modelName: 'PipelineAssignment',
      tableName: 'PipelineAssignments',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      indexes: [
        {
          unique: true,
          fields: ['pipelineId', 'userId'],
        },
      ],
    }
  );

  return PipelineAssignment;
};