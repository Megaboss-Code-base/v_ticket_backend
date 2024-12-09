'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Rename 'fullName' to 'full_name' column in the 'user' table
    await queryInterface.renameColumn('user', 'fullName', 'full_name');
  },

  async down (queryInterface, Sequelize) {
    // Revert the column name change if needed
    await queryInterface.renameColumn('user', 'full_name', 'fullName');
  }
};
