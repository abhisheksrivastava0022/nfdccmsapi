'use strict';

/** @type {import('sequelize-cli').Migration} */
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
    const dataInsert = [
      {
        meta: 'website_type',
        meta_value: 'NFDC',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        meta: 'website_type',
        meta_value: 'IFFI',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        meta: 'language',
        meta_value: 'en',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        meta: 'language',
        meta_value: 'hi',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        meta: 'post',
        meta_value: 'post',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        meta: 'post',
        meta_value: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      },

    ];
    return queryInterface.bulkInsert('settings', dataInsert, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('settings', null, {});

  }
};
