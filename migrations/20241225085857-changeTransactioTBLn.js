'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove userId column and add email, fullName
    await queryInterface.removeColumn('transactions', 'userId');
    await queryInterface.addColumn('transactions', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('transactions', 'fullName', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes if needed
    await queryInterface.addColumn('transactions', 'userId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    });
    await queryInterface.removeColumn('transactions', 'email');
    await queryInterface.removeColumn('transactions', 'fullName');
  },
};
