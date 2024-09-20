const Joi = require('joi');
const { permission, user_roles } = require("../constants/user");
const role_list = []
user_roles.map((data) => {
    role_list.push(data.name)
})

permission.map((data) => {
    role_list.push(data.name)
})
exports.create = Joi.object({
    name: Joi.string().max(100).required(),
    username: Joi.string().required(),
    profile: Joi.number().integer(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    user_roles: Joi.array().items(
        Joi.string().valid(...role_list).required()
    ).required()
})


exports.login = Joi.object({
    username: Joi.string().max(100).required(),
    password: Joi.string().required(),
})


exports.update = Joi.object({
    name: Joi.string().max(100),
    username: Joi.string().allow('', null),
    role: Joi.string().allow('', null),
    profile: Joi.number().integer(),
    email: Joi.string().email().allow('', null),
    user_roles: Joi.array().items(
        Joi.string().valid(...role_list).required()
    ).allow('', null),
    status: Joi.number().integer().allow('', null),
    type: Joi.number().integer().allow('', null),
})


exports.changePassword = Joi.object({
    current_password: Joi.string().max(100).required(),
    change_password: Joi.string().required(),
})

exports.role = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
})

exports.resetPassword = Joi.object({
    email: Joi.string().email().max(256).required(),

})
exports.verifyToken = Joi.object({
    token: Joi.string().max(1000).required(),
})
exports.changeTokenPassword = Joi.object({
    token: Joi.string().max(1000).required(),
    change_password: Joi.string().required(),
})

exports.subcribe = Joi.object({
    email: Joi.string().email().required(),
})
