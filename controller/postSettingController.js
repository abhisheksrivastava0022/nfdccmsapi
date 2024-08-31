const CatchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const db = require('../models');

exports.auth = CatchAsync(async (req, res, next) => {
    next();
})

exports.index = CatchAsync(async (req, res, next) => {
    const settings = await db.setting.findAll();
    const data = {};
    for (const setting of settings) {
        //  console.log({ setting });
        if (data[setting.meta]) {
            data[setting.meta].push(setting.meta_value);
        } else {
            data[setting.meta] = [setting.meta_value];
        }
    }
    const output = {
        status: true,
        data,
        message: ''
    }
    res.status(200).json(output);
})

exports.create = CatchAsync(async (req, res, next) => {
    const postData = req.body;

    const data = await db.setting.create({
        meta: postData.meta,
        meta_value: postData.meta_value,
    });

    const output = {
        status: true,
        data,
        message: ''
    }
    res.status(200).json(output);
})
exports.update = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const { id } = req.params; //req.params {postdata}
    const settings = await db.setting.findByPk(id);
    await settings.update({
        meta: postData.meta,
        meta_value: postData.meta_value,
    })

    const data = null;
    const output = {
        status: true,
        data,
        message: ''
    }
    res.status(200).json(output);
})

