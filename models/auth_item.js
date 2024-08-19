'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Auth_item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here
    }
  }
  Auth_item.init({
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    description: DataTypes.STRING,
    user_type: {
      type: DataTypes.INTEGER,
      defaultValues: 1
    }
  }, {
    sequelize,
    modelName: 'auth_item',
  });
  return Auth_item;
};