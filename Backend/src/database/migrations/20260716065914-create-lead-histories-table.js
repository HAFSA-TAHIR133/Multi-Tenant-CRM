import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('LeadHistories', {
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
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Leads', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    changedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    oldValue: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
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
  await queryInterface.dropTable('LeadHistories');
}