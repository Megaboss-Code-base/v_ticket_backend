"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("events", "commissionRate", {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: 0.1,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("events", "commissionRate");
  },
};
