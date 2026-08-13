export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Users', 'resetOtp', {
    type: Sequelize.DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn('Users', 'resetOtpExpires', {
    type: Sequelize.DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Users', 'resetOtp');
  await queryInterface.removeColumn('Users', 'resetOtpExpires');
}