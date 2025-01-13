'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the new enum value 'used' to the existing ENUM type
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_tickets_validationStatus') THEN
          ALTER TYPE "enum_tickets_validationStatus" ADD VALUE 'used';
        END IF;
      END $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Reverting an ENUM change requires creating a new type without 'used' and swapping it
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_tickets_validationStatus_new" AS ENUM ('valid', 'invalid', 'expired');

      ALTER TABLE "tickets"
      ALTER COLUMN "validationStatus" TYPE "enum_tickets_validationStatus_new"
      USING "validationStatus"::text::"enum_tickets_validationStatus_new";

      DROP TYPE "enum_tickets_validationStatus";

      ALTER TYPE "enum_tickets_validationStatus_new" RENAME TO "enum_tickets_validationStatus";
    `);
  },
};
