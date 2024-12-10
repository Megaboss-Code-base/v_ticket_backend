'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user', 'resetPasswordToken');
    await queryInterface.removeColumn('user', 'resetPasswordExpire');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('user', 'resetPasswordToken', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user', 'resetPasswordExpire', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }
};
