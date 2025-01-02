'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Remove the existing default value
    await queryInterface.sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    `);

    // Step 2: Change the column type to ENUM
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'admin'),
      allowNull: false,
    });

    // Step 3: Set the new default value
    await queryInterface.sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Step 1: Change the column back to STRING
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Step 2: Remove the ENUM type explicitly
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_users_role";
    `);
  },
};
