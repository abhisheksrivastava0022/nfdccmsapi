const CatchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const db = require('../models');
const Sequelize = require("sequelize");
exports.auth = CatchAsync(async (req, res, next) => {
    next();
})

exports.index = CatchAsync(async (req, res, next) => {
    const settings = await db.setting.findAll(
        {
            where: {
                setting_id: null
            }
        }
    );
    const data = {};
    for (const setting of settings) {
        if (data[setting.meta]) {
            data[setting.meta].push({
                value: setting.meta_value,
                id: setting.id
            });
        } else {
            data[setting.meta] = [{
                value: setting.meta_value,
                id: setting.id
            }];
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

    if (postData?.meta_value) {
        await db.setting.create({
            meta: postData.meta,
            meta_value: postData.meta_value,
            setting_id: (postData.setting_id) ? postData.setting_id : null,
        });
    }
    if (postData?.datas) {
        const meta_values = [];
        for (const data of postData.datas) {
            if (!data) continue;
            meta_values.push(data);
            const setting_value = await db.setting.findOne({
                where: {
                    meta: postData.meta,
                    meta_value: data,
                    setting_id: postData.setting_id,
                }
            });
            if (!setting_value) {
                await db.setting.create({
                    meta: postData.meta,
                    meta_value: data,
                    setting_id: postData.setting_id,
                });
            }

        }
        await db.setting.destroy({
            where: {
                meta: postData.meta,
                setting_id: postData.setting_id,
                meta_value: {
                    [Sequelize.Op.notIn]: meta_values,
                },
            },
        });
        await db.setting.destroy({
            where: {
                // meta: postData.meta,
                //   setting_id: postData.setting_id,
                meta_value: null
            },
        });
    }
    const output = {
        status: true,
        data: "",
        message: 'Settins added successfully.'
    }
    res.status(200).json(output);
})
exports.update = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const { id } = req.params; //req.params {postdata}
    const settings = await db.setting.findByPk(id);
    await settings.update({
        //  meta: postData.meta,
        meta_value: postData.meta_value,
    })

    const data = null;
    const output = {
        status: true,
        data,
        message: 'Updated successfully.'
    }
    res.status(200).json(output);
})

exports.changeOrAddMeta = CatchAsync(async (req, res, next) => {
    const postData = req.body;

    if (postData?.meta_value) {
        const setting = await db.setting.findOne({
            where: {
                meta: postData.meta,
                //meta_value: postData.meta_value,
                setting_id: (postData.setting_id) ? postData.setting_id : null,
            }
        });
        if (!setting) {
            await db.setting.create({
                meta: postData.meta,
                meta_value: postData.meta_value,
                setting_id: (postData.setting_id) ? postData.setting_id : null,
            });
        } else {
            setting.update({
                meta_value: postData.meta_value,
            });
        }

    }

    const data = null;
    const output = {
        status: true,
        data,
        message: ' successfully.'
    }
    res.status(200).json(output);
})
exports.delete = CatchAsync(async (req, res, next) => {

    const { id } = req.params; //req.params {postdata}
    const settings = await db.setting.findByPk(id);
    await settings.destroy();

    const data = null;
    const output = {
        status: true,
        data,
        message: ' Deleted successfully.'
    }
    res.status(200).json(output);
})

exports.websiteSetting = CatchAsync(async (req, res, next) => {
    const { id } = req.params; //req.params {postdata}
    const settings = await db.setting.findAll(
        {
            where: {
                setting_id: id
            }
        }
    );
    const data = {};
    for (const setting of settings) {
        if (data[setting.meta]) {
            data[setting.meta].push({
                value: setting.meta_value,
                id: setting.id
            });
        } else {
            data[setting.meta] = [{
                value: setting.meta_value,
                id: setting.id
            }];
        }
    }
    const output = {
        status: true,
        data,
        message: ''
    }
    res.status(200).json(output);
})
