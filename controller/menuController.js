const CatchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const db = require('../models');
const Sequelize = require("sequelize");
exports.auth = CatchAsync(async (req, res, next) => {
    next();
})

exports.index = CatchAsync(async (req, res, next) => {
    const { id } = req.params;
    const data = await db.menu.findAll(
        {
            where: {
                website_setting_id: id
            }
        }
    );
    const output = {
        status: true,
        data,
        message: ''
    }
    res.status(200).json(output);
})

exports.create = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const data = await db.menu.create({
        name: postData.menu_create,
        // payload_data: postData.payload_data,
        website_setting_id: (postData.website_setting_id),
    });
    const output = {
        status: true,
        data: data.id,
        message: 'Menu created successfully.'
    }
    res.status(200).json(output);
})
exports.update = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const { id } = req.params; //req.params {postdata}
    const menu = await db.menu.findByPk(id);
    await menu.update({
        name: postData.name,
        payload_data: postData.payload,
    })

    const data = null;
    const output = {
        status: true,
        data,
        message: 'Updated successfully.'
    }
    res.status(200).json(output);
})

exports.delete = CatchAsync(async (req, res, next) => {

    const { id } = req.params; //req.params {postdata}
    const settings = await db.menu.findByPk(id);
    await settings.destroy();

    const data = null;
    const output = {
        status: true,
        data,
        message: ' Deleted successfully.'
    }
    res.status(200).json(output);
})
exports.details = CatchAsync(async (req, res, next) => {
    const { id } = req.params; //req.params {postdata}
    const data = await db.menu.findByPk(id);

    const output = {
        status: true,
        data,
        message: ''
    }
    res.status(200).json(output);
})