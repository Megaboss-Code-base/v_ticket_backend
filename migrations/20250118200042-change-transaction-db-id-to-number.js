// 'use strict';

// module.exports = {
//   async up(queryInterface, Sequelize) {
//     // Step 1: Add a new column `id_temp` of type INTEGER with auto-increment
//     await queryInterface.addColumn('transactions', 'id_temp', {
//       type: Sequelize.INTEGER,
//       allowNull: false,
//       autoIncrement: true, // Enable auto-increment
//     });

//     // Step 2: Populate `id_temp` with appropriate values from the current `id` column
//     // Ensure all `id` values are valid integers before running this migration.
//     await queryInterface.sequelize.query(`
//       UPDATE transactions
//       SET id_temp = CAST(id AS INTEGER)
//     `);

//     // Step 3: Drop the old `id` column
//     await queryInterface.removeColumn('transactions', 'id');

//     // Step 4: Rename `id_temp` to `id`
//     await queryInterface.renameColumn('transactions', 'id_temp', 'id');

//     // Step 5: Add primary key constraint with auto-increment
//     await queryInterface.changeColumn('transactions', 'id', {
//       type: Sequelize.INTEGER,
//       allowNull: false,
//       autoIncrement: true, // Add auto-increment
//       primaryKey: true,
//     });
//   },

//   async down(queryInterface, Sequelize) {
//     // Revert the changes: Restore `id` as a STRING column
//     await queryInterface.addColumn('transactions', 'id_temp', {
//       type: Sequelize.STRING,
//       allowNull: false,
//     });

//     // Optionally restore data
//     await queryInterface.sequelize.query(`
//       UPDATE transactions
//       SET id_temp = id::TEXT
//     `);

//     // Drop the INTEGER `id` column
//     await queryInterface.removeColumn('transactions', 'id');

//     // Rename `id_temp` back to `id`
//     await queryInterface.renameColumn('transactions', 'id_temp', 'id');
//   },
// };
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Remove the current `id` primary key constraint if needed
    await queryInterface.removeColumn('transactions', 'id');

    // Step 2: Add `id` column as an auto-incrementing primary key
    await queryInterface.addColumn('transactions', 'id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert: drop INTEGER id
    await queryInterface.removeColumn('transactions', 'id');

    // Recreate old id column as string
    await queryInterface.addColumn('transactions', 'id', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
