'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('events', 'ticketType', {
      type: Sequelize.JSONB,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('events', 'ticketType', {
      type: Sequelize.JSONB,
      allowNull: false,
    });
  },
};
