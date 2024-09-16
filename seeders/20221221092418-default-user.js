'use strict';
const auth = require("../helper/auth");
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
    return await queryInterface.bulkInsert("users", [

      {
        first_name: "Abhishek",
        last_name: "Srivastava",
        username: "abhishek@sisl.info",
        email: "abhishek@sisl.info",
        password: await auth.generatePassword("123456"),
        status: 1,
        type: 1,
      },

    ], {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, { truncate: true, cascade: true, restartIdentity: true });
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
