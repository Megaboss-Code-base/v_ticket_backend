import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('user', 'resetPasswordToken', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user', 'resetPasswordExpire', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('user', 'id', {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    });
    await queryInterface.addColumn('user', 'fullName', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('user', 'phone', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('user', 'email', {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    });
    await queryInterface.addColumn('user', 'password', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('user', 'profilePic', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "https://mighty.tools/mockmind-api/content/abstract/41.jpg",
    });
    await queryInterface.addColumn('user', 'role', {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["user", "admin", "vendor"]],
      },
    });
    await queryInterface.addColumn('user', 'businessName', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user', 'companyWebsite', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user', 'address', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('user', 'timezone', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('user', 'resetPasswordToken');
    await queryInterface.removeColumn('user', 'resetPasswordExpire');
    await queryInterface.removeColumn('user', 'id');
    await queryInterface.removeColumn('user', 'fullName');
    await queryInterface.removeColumn('user', 'phone');
    await queryInterface.removeColumn('user', 'email');
    await queryInterface.removeColumn('user', 'password');
    await queryInterface.removeColumn('user', 'profilePic');
    await queryInterface.removeColumn('user', 'role');
    await queryInterface.removeColumn('user', 'businessName');
    await queryInterface.removeColumn('user', 'companyWebsite');
    await queryInterface.removeColumn('user', 'address');
    await queryInterface.removeColumn('user', 'timezone');
  },
};
