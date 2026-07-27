import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Tenant extends Model {}

  Tenant.init(
    {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
         allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      domain: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
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
      modelName: 'Tenant',
      tableName: 'Tenants',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return Tenant;
};