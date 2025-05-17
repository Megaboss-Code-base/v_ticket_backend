'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'users', // Table name
      'paystackRecipientCode', // Column name
      {
        type: Sequelize.STRING,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'paystackRecipientCode');
  },
};