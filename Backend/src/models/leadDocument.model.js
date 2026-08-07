import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class LeadDocument extends Model {}

  LeadDocument.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      leadId: {
        type: DataTypes.INTEGER,
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
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "createdAt",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updatedAt",
      },
    },
    {
      sequelize,
      modelName: "LeadDocument",
      tableName: "LeadDocuments",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return LeadDocument;
};