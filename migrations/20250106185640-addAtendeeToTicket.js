'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tickets', 'attendees', {
      type: Sequelize.JSONB,
      allowNull: true, // Optional for single-person tickets
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tickets', 'attendees');
  },
};
