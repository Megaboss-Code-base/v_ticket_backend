module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("events", "time", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'default_time', // Set a default value
    });

    await queryInterface.addColumn("events", "venue", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'default_venue', // Set a default value
    });

    await queryInterface.addColumn("events", "gallery", {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    });

    await queryInterface.addColumn("events", "socialMediaLinks", {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.addColumn("events", "hostName", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'default_host', // Set a default value
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("events", "time");
    await queryInterface.removeColumn("events", "venue");
    await queryInterface.removeColumn("events", "gallery");
    await queryInterface.removeColumn("events", "socialMediaLinks");
    await queryInterface.removeColumn("events", "hostName");
  },
};
