// Filename: migrations/[timestamp]-add-virtual-fields-to-events.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('events', 'isVirtual', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('events', 'virtualLink', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('events', 'isVirtual');
    await queryInterface.removeColumn('events', 'virtualLink');
  }
};