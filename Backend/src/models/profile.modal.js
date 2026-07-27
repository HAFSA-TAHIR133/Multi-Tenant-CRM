import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Profile extends Model {}

  Profile.init(
    {
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
         allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      designation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING,
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
      modelName: 'Profile',
      tableName: 'Profiles',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return Profile;
};