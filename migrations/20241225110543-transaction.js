"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the existing enum type and replace it with a string
    await queryInterface.changeColumn("transactions", "paymentStatus", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the column back to an enum if needed
    await queryInterface.changeColumn("transactions", "paymentStatus", {
      type: Sequelize.ENUM("successful", "pending", "failed"), // Adjust enum values if necessary
      allowNull: false,
    });
  },
};
