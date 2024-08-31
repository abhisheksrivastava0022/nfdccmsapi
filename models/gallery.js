'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class gallery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  gallery.init({
    url: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING
    },
    website_setting_id: {
      type: DataTypes.INTEGER
    },
  }, {
    sequelize,
    modelName: 'gallery',
  });
  return gallery;
};