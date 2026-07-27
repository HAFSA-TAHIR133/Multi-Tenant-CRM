import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('Stages', {
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
    pipelineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Pipelines', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });


}

export async function down(queryInterface) {
  await queryInterface.dropTable('Stages');
}