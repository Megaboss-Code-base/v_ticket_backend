const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    // Add "Invalid" to the enum type in PostgreSQL
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_tickets_validationStatus" ADD VALUE 'Invalid';
    `);

    // Update the column definition
    await queryInterface.changeColumn("tickets", "validationStatus", {
      type: DataTypes.ENUM("Valid", "Used", "Expired", "Invalid"),
      allowNull: false,
      defaultValue: "Invalid",
    });
  },

  down: async (queryInterface) => {
    // Revert the column definition (Note: Removing an enum value is more complex and might require a separate migration or workaround)
    await queryInterface.changeColumn("tickets", "validationStatus", {
      type: DataTypes.ENUM("Valid", "Used", "Expired"),
      allowNull: false,
      defaultValue: "Valid",
    });
  },
};
