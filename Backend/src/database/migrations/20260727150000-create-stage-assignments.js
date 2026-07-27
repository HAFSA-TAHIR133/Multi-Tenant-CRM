'use strict';

export  async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('StageAssignments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stages',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('StageAssignments', ['stageId', 'userId'], {
      unique: true,
      name: 'stage_assignments_stage_user_unique',
    });
  };

export  async function down(queryInterface) {
    await queryInterface.dropTable('StageAssignments');
  };