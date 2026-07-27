import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('RefreshTokens', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },

    token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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
  await queryInterface.dropTable('RefreshTokens');
}