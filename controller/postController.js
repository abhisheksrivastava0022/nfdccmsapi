const CatchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const db = require('../models');
const { settings } = require("../app");
const Sequelize = require("sequelize");

exports.auth = CatchAsync(async (req, res, next) => {
    next();
})

exports.index = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const buildingParam = {
        where: {
            post_setting_id: postData.post_setting_id,
            language: postData.language,
        }
    };
    const post = await db.post.findAll(buildingParam);
    const count = await db.post.count(buildingParam);

    const output = {
        status: true,
        data: {
            list: post,
            total_count: count,
        },
        message: ''
    }
    res.status(200).json(output);
})

exports.create = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    let slug = (postData.title).replace(/[^a-zA-Z ]/g, "");
    slug = (slug).replace(/ /g, "_");
    const post = await db.post.create({
        slug,
        title: postData.title,
        content: postData.content,
        //short_description: postData.short_description,
        status: 1,
        language: postData.language,
        post_setting_id: postData.post_setting_id,
        parent_id: postData.parent_id,
        created_by: req.userlogin.id,
        updated_by: req.userlogin.id,
    });
    if (!postData.parent_id) {
        await post.update({
            parent_id: post.id,
        });
    }
    const output = {
        status: true,
        data: post.id,
        message: 'Post added successfully.'
    }
    res.status(200).json(output);
})
exports.update = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const { id } = req.params; //req.params {postdata}
    const post = await db.post.findByPk(id);

    const datatoUPdate = {
        slug: postData.slug,
        title: postData.title,
        content: postData.content,
        short_description: postData.short_description,
        updated_by: req.userlogin.id,
    }
    await post.update(datatoUPdate)
    const post_meta_list = [];
    if (postData?.fields) {

        for (const field of postData?.fields) {
            post_meta_list.push(field.meta)
            const check_post_meta = await db.post_meta.findOne({
                where: {
                    meta: field.meta,
                    meta_type: 1,
                    post_id: id
                }
            })
            if (check_post_meta) {
                await check_post_meta.update({
                    meta_value: field.meta_value,
                });
            } else {
                await db.post_meta.create({
                    post_id: id,
                    meta_value: field.meta_value,
                    meta: field.meta,
                    meta_type: 1,
                })
            }
        }

    }
    await db.post_meta.destroy({
        where: {
            post_id: id,
            meta: {
                [Sequelize.Op.notIn]: post_meta_list,
            },
        },
    });
    const data = null;
    const output = {
        status: true,
        data,
        message: 'Updated successfully.'
    }
    res.status(200).json(output);
})
exports.addFeature = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    console.log();
    const { id } = req.params; //req.params {postdata}
    const post = await db.post.findByPk(id);
    const datatoUPdate = {};
    console.log({ postData });
    datatoUPdate.featured_image_id = postData.featured_image_id
    await post.update(datatoUPdate)
    const output = {
        status: true,
        data: await db.gallery.findByPk(post.featured_image_id),
        message: 'added successfully.'
    }
    res.status(200).json(output);
})
exports.detail = CatchAsync(async (req, res, next) => {
    const { id } = req.params; //req.params {postdata}

    const post = JSON.parse(JSON.stringify((await db.post.findByPk(id))));
    if (post.featured_image_id) {
        post.featured_image = await db.gallery.findByPk(post.featured_image_id);
    }
    post.post_meta = JSON.parse(JSON.stringify((await db.post_meta.findAll({
        attributes: ["meta", "meta_value"],
        where: {
            post_id: id
        }
    }))));
    post.check_other_lang = JSON.parse(JSON.stringify((await db.post.findAll({
        attributes: ["language", "id"],
        where: {
            parent_id: post.parent_id
        }
    }))));
    const output = {
        status: true,
        data: post,
        message: ''
    }
    res.status(200).json(output);
})

exports.delete = CatchAsync(async (req, res, next) => {
    const { id } = req.params; //req.params {postdata}
    const post = await db.post.findByPk(id);
    await post.destroy();

    const data = null;
    const output = {
        status: true,
        data,
        message: 'Deleted successfully.'
    }
    res.status(200).json(output);
})


exports.createPostMeta = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const { id } = req.params; //req.params {postdata}
    const post_meta = await db.post_meta.create({
        meta: postData.meta,
        meta_value: postData.meta_value,
        meta_type: postData.meta_type,
    });
    const output = {
        status: true,
        data: '',
        message: 'Post added successfully.'
    }
    res.status(200).json(output);
})


exports.deletePostMeta = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const { id } = req.params; //req.params {postdata}
    const post = await db.post_meta.findByPk(id);
    await post.destroy();
    const output = {
        status: true,
        data: '',
        message: 'Post meta deleted successfully.'
    }
    res.status(200).json(output);
})