'use strict';
const { roles } = require("../config/appconfig");
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
  

    return await queryInterface.bulkInsert("auth_items", roles, {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('auth_items', null, { truncate: true, cascade: true, restartIdentity: true });

    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
