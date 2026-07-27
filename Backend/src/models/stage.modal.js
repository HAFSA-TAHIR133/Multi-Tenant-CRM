import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Stage extends Model {}

  Stage.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      probability: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      order: {
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
      modelName: 'Stage',
      tableName: 'Stages',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return Stage;
};