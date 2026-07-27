import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class User extends Model {}

  User.init(
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastLogin: {
        type: DataTypes.DATE,
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
      modelName: 'User',
      tableName: 'Users',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return User;
};