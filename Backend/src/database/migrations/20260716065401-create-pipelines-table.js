// migrations/20260101000004-create-pipelines.js
import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('Pipelines', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
  await queryInterface.dropTable('Pipelines');
}