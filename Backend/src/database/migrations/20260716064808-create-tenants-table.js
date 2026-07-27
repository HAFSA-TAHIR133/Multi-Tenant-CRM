import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('Tenants', {
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
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

}

export async function down(queryInterface) {
  await queryInterface.dropTable('Tenants');
}