'use strict';

export async function up(queryInterface, Sequelize) {
  const tableDefinition = await queryInterface.describeTable('Stages');

  if (!tableDefinition.probability) {
    await queryInterface.addColumn('Stages', 'probability', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
}

export async function down(queryInterface) {
  const tableDefinition = await queryInterface.describeTable('Stages');

  if (tableDefinition.probability) {
    await queryInterface.removeColumn('Stages', 'probability');
  }
}