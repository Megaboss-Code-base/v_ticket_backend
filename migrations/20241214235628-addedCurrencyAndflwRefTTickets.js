const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn("tickets", "currency", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "NGN", // Set a default currency if applicable
    });

    await queryInterface.addColumn("tickets", "flwRef", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tickets", "currency");
    await queryInterface.removeColumn("tickets", "flwRef");
  },
};
