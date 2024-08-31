'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class post_meta extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  post_meta.init({
    meta: DataTypes.STRING,
    meta_type: DataTypes.INTEGER,
    post_id: DataTypes.INTEGER,
    meta_value: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'post_meta',
  });
  return post_meta;
};