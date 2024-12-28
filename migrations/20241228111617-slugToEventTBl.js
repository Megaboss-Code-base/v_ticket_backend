module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Add the slug column first
    await queryInterface.addColumn("events", "slug", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'default-slug',  // Provide a default value for existing rows
    });

    // Step 2: Update existing rows with a default slug if needed
    await queryInterface.sequelize.query(`
      UPDATE events
      SET slug = 'default-slug'
      WHERE slug IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("events", "slug");
  },
};
