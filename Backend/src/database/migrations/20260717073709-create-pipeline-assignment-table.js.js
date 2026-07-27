export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('PipelineAssignments', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    pipelineId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Pipelines',
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
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addConstraint('PipelineAssignments', {
    fields: ['pipelineId', 'userId'],
    type: 'unique',
    name: 'unique_pipeline_user_assignment',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('PipelineAssignments');
}