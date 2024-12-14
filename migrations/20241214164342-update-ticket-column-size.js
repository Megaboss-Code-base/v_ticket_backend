module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("tickets", "qrCode", {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("tickets", "qrCode", {
      type: Sequelize.STRING(255),  // Revert back to VARCHAR(255) if necessary
      allowNull: false,
    });
  },
};
