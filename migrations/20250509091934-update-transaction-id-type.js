'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change the id column type from BIGINT to STRING
    await queryInterface.changeColumn('transactions', 'id', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the id column type back to BIGINT in case of rollback
    await queryInterface.changeColumn('transactions', 'id', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  }
};
