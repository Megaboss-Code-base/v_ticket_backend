"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove old fields
    await queryInterface.removeColumn("events", "isVirtual");
    await queryInterface.removeColumn("events", "virtualLink");
    await queryInterface.removeColumn("events", "virtualPassword");

    // Add new virtualEventDetails field
    await queryInterface.addColumn("events", "virtualEventDetails", {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove new field
    await queryInterface.removeColumn("events", "virtualEventDetails");

    // Re-add old fields
    await queryInterface.addColumn("events", "isVirtual", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    await queryInterface.addColumn("events", "virtualLink", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("events", "virtualPassword", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
