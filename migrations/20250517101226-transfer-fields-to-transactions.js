"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("transactions", "transferStatus", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pending",
    });

    await queryInterface.addColumn("transactions", "transferReference", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("transactions", "transferStatus");
    await queryInterface.removeColumn("transactions", "transferReference");
  },
};

// "use strict";

// module.exports = {
//   async up(queryInterface, Sequelize) {
//     // Add new columns
//     await queryInterface.addColumn("transactions", "transferStatus", {
//       type: Sequelize.STRING,
//       allowNull: false,
//       defaultValue: "pending",
//     });

//     await queryInterface.addColumn("transactions", "transferReference", {
//       type: Sequelize.STRING,
//       allowNull: true,
//     });

//     // Add unique constraint in the same migration
//     await queryInterface.addConstraint("transactions", {
//       fields: ["paymentReference"],
//       type: "unique",
//       name: "transactions_paymentReference_unique",
//     });
//   },

//   async down(queryInterface, Sequelize) {
//     await queryInterface.removeColumn("transactions", "transferStatus");
//     await queryInterface.removeColumn("transactions", "transferReference");
//     await queryInterface.removeConstraint(
//       "transactions",
//       "transactions_paymentReference_unique"
//     );
//   },
// };