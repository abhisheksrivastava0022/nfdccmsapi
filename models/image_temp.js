'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Image_temp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Image_temp.init({
    url: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'image_temp',
    freezeTableName: true,
    tableName: 'image_temp'
  });
  return Image_temp;
};