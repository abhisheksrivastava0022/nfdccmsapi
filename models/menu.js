'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class menu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  menu.init({
    name: {
      type: DataTypes.STRING
    },
    payload_data: {
      type: 'LONGTEXT'
    },
    website_setting_id: {
      type: DataTypes.STRING
    },
  }, {
    sequelize,
    modelName: 'menu',
  });
  return menu;
};