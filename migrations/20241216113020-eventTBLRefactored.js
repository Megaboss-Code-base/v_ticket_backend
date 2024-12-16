module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('events', 'ticketType', {
      type: Sequelize.JSONB,
      allowNull: false,
    });

    // Optionally, remove old columns if they are no longer needed
    await queryInterface.removeColumn('events', 'price');
    await queryInterface.removeColumn('events', 'quantity');
    await queryInterface.removeColumn('events', 'sold');
  },

  down: async (queryInterface, Sequelize) => {
    // To reverse the changes if needed, add the removed columns back
    await queryInterface.addColumn('events', 'price', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn('events', 'quantity', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn('events', 'sold', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('events', 'ticketType', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },
};
