import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('LeadDocuments', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    leadId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    tenantId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: 'createdAt',
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: 'updatedAt',
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('LeadDocuments');
}