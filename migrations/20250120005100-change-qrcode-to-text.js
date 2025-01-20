'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change qrCode column type from STRING to TEXT
    await queryInterface.changeColumn('tickets', 'qrCode', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert qrCode column type back to STRING
    await queryInterface.changeColumn('tickets', 'qrCode', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });
  },
};
