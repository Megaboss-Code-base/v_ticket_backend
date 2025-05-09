'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'account_name', {
      type: Sequelize.STRING,
      allowNull: true, // This can be adjusted based on whether you want it to be nullable or not
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'account_name');
  }
};
