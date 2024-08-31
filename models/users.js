const auth = require("../helper/auth");
const { roles } = require("../constants/access_module");
const { rolesPermission, permission, user_roles } = require("../constants/user");
var jwt = require("jsonwebtoken");
("use strict");
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    user = "";
    pass = "";
    token = "";


    static get roles() {
      return roles
    }
    static get rolesPermission() {
      return rolesPermission
    }
    static get permission() {
      return permission;
    }
    static get user_roles() {
      return user_roles;
    }

    static getConstants = () => ({
      userRoles: roles,
      rolesPermission,
      permission,
      userRole: user_roles,
    })

    static associate(models) {
      this.hasMany(models.auth_assignment, { foreignKey: "user_id" });
      this.hasMany(models.auth_assignment, { foreignKey: "user_id", as: "roles" });
      // this.hasMany(models.user_session, { foreignKey: "user_id" });
      //  this.hasOne(models.PushSubscription, { foreignKey: "user_id" });
    }

    static get userAttributes() {
      return ["id", "username", "email", "status", "type"];
    }

    static setUserData = (data) => {
      return {
        name: data.name ?? null,
        email: data.email ?? null,
        status: data.status ?? 1,
        username: data.username ?? null,
      };
    };
    async getUserByToken() {
      try {
        const user = await Users.findOne({
          where: { access_token: this.token },
        });
        if (user == null) {
          return false;
        } else {
          return user;
        }
      } catch (err) {
        return false;
      }
    }
    async setUserRoleAssignment(db, user_roles) {
      await db.auth_assignment.destroy({
        where: {
          user_id: this.id
        }
      })
      user_roles = [...new Set(user_roles)]
      for (const permision of user_roles) {
        await db.auth_assignment.create({ user_id: this.id, item_name: permision });
      }
    }
    async VerifyToken(db) {
      try {
        const user_session = await db.user_session.findOne({
          where: {
            token: this.token
          }
        })

        if (!user_session) return false;
        const user = JSON.parse(JSON.stringify(await Users.findOne({
          where: { id: user_session.user_id },
          attributes: ['id', 'name', 'username', 'email', 'status', 'type'],
          include: [
            {
              model: db.auth_assignment,
              attributes: [["item_name", "role"]],
              as: "roles",
              required: false
            }
          ]
        })));
        const userroles = [];
        if (user.roles) {
          user.roles.map((roles) => {
            userroles.push(roles.role);
          })
        }

        user.roles = [...new Set(userroles)]
        user.session = user_session

        if (user == null) {
          return false;
        } else {
          return user;
        }
      } catch (err) {
        return false;
      }
    }
    async updateToken(db, ip, web_info) {
      const data = { ...this.dataValues };

    }
    async login() {
      try {
        const user = await Users.findOne({
          where:
          {
            username: this.user,
            //  status: [0, 1]
          }
        });

        if (!user) return false;


        var check = await auth.verifyPassword(
          this.pass,
          user["dataValues"]["password"]
        );
        if (check === true) {
          return user;
        } else {
          return false;
        }
      } catch (err) {
        console.log(err);
        return false;
      }
    }

    async passwordChange(change_password, user_login_id) {
      const dataoutput = {};
      // console.log(user_login_id);
      try {
        const user = await Users.findByPk(user_login_id);
        var password = await auth.generatePassword(change_password);
        if (await user.update({ password: password })) {
          dataoutput["status"] = 200;
          dataoutput["message"] = "Data saved successfully";
        }

      } catch (err) {
        console.log(err);
        return false;
      }
      return dataoutput;
    }
    async changePasswword(current_password, change_password, user_login_id) {
      const dataoutput = {};
      // console.log(user_login_id);
      try {
        const user = await Users.findByPk(user_login_id);
        var check = await auth.verifyPassword(
          current_password,
          user.password
        );
        if (check === true) {
          var password = await auth.generatePassword(change_password);
          if (await user.update({ password: password })) {
            dataoutput["status"] = 200;
            dataoutput["message"] = "Data saved successfully";
          }
        } else {
          dataoutput["status"] = 501;
          dataoutput["message"] = "Current password is wrong";
        }
      } catch (err) {
        console.log(err);
        return false;
      }
      return dataoutput;
    }
    async changeUserPasswword(change_password, user_login_id) {

      const user = await Users.findByPk(user_login_id);
      const password = await auth.generatePassword(change_password);
      await user.update({ password: password })

      return {
        status: 200,
        message: "Data saved successfully"
      };
    }
  }
  Users.init(
    {
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'First name is required and cannot be null.', // Custom error message for null
          },
          notEmpty: {
            msg: 'First name cannot be an empty string.', // Custom error message for empty string
          },
        },
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Last name is required and cannot be null.', // Custom error message for null
          },
          notEmpty: {
            msg: 'Last name cannot be an empty string.', // Custom error message for empty string
          },
        },
      },
      username: {
        validate: {
          notNull: {
            msg: 'Username is required and cannot be null.', // Custom error message for null
          },
          notEmpty: {
            msg: 'Username cannot be an empty string.', // Custom error message for empty string
          },
          isUnique: async function (value, next) {
            var self = this;
            let datarel = await Users.findOne({ where: { username: value } });


            if (datarel && self.id !== datarel.id) {
              return next("Username already in use!");
            }
            return next();
          },
        },
        type: DataTypes.STRING,
        allowNull: false,

      },
      access_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        notEmpty: true,
        validate: {
          isEmail: true,
          notNull: {
            msg: 'Email is required and cannot be null.', // Custom error message for null
          },
          notEmpty: {
            msg: 'Email cannot be an empty string.', // Custom error message for empty string
          },
          isUnique: async function (value, next) {
            var self = this;
            let datarel = await Users.findOne({ where: { email: value } });


            if (datarel && self.id !== datarel.id) {
              return next("Email already in use!");
            }
            return next();
          },
        },
        unique: {
          args: "email",
          msg: "The email is already taken!",
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Password is required and cannot be null.', // Custom error message for null
          },
          notEmpty: {
            msg: 'Password cannot be an empty string.', // Custom error message for empty string
          },
        },
      },

      status: {
        type: "smallint",
        allowNull: false,
        defaultValue: 0,
      },
      type: {
        type: "smallint",
        allowNull: false,
        defaultValue: 0,
      },

      access_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
      sequelize,
      modelName: "users",
    }
  );

  return Users;
};
