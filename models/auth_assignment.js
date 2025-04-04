'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Auth_assignment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.auth_item, { foreignKey: 'name', sourceKey: "item_name" })
    }
    static async updatePermsion(permision,user_id_data){
      const user =  await this.create({user_id:user_id_data,item_name:permision  });
      await user.save();
    }
    async getUserpermissionsById(user_id_data){
   
      let data =  await this.findAll({where :{user_id:user_id_data},
      attributes:[['item_name','name']],
      raw:true
      });
      return data;
    }


  }
  Auth_assignment.init({
    item_name: DataTypes.STRING,
    user_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'auth_assignment',
    freezeTableName: true,
    tableName: 'auth_assignment'
  });
  return Auth_assignment;
};