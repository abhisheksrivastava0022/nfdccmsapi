'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  post.init({
    slug: {
      type: DataTypes.STRING
    },
    title: {
      type: DataTypes.STRING
    },
    content: {
      type: DataTypes.TEXT
    },
    short_description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.TINYINT
    },
    language: {
      type: DataTypes.STRING
    },
    parent_id: {
      type: DataTypes.INTEGER
    },
    post_setting_id: {
      type: DataTypes.INTEGER
    },
    featured_image_id: {
      type: DataTypes.INTEGER
    },
    created_by: {
      type: DataTypes.STRING
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
  }, {
    sequelize,
    modelName: 'post',
  });
  return post;
};