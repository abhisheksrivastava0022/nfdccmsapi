'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      slug: {
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      content: {
        type: Sequelize.TEXT
      },
      short_description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.TINYINT
      },
      language: {
        type: Sequelize.STRING
      },
      parent_id: {
        type: Sequelize.INTEGER
      },
      post_setting_id: {
        type: Sequelize.INTEGER
      },
      featured_image_id: {
        type: Sequelize.INTEGER
      },
      created_by: {
        type: Sequelize.STRING
      },
      updated_by: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
  }
};