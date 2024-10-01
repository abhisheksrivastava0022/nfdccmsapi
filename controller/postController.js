const CatchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const db = require('../models');
const Sequelize = require("sequelize");

exports.auth = CatchAsync(async (req, res, next) => {
    next();
})

exports.postCount = CatchAsync(async (req, res, next) => {

    const { setting_id } = req.params; //req.params {postdata}

    const posts = await db.setting.findAll({
        where: {
            meta: "post",
            setting_id
        }
    })
    const data = [];
    for (const postobj of posts) {
        const postcount = await db.post.count({
            where: {
                post_setting_id: postobj.id,
                language: 'en',
            }
        });

        data.push({
            post_id: postobj.id,
            post_name: postobj.meta_value,
            count: postcount,
        });
    }

    // Prepare the output
    const output = {
        status: true,
        data: data,
        message: ''
    };

    // Send the response
    res.status(200).json(output);
});

exports.postlist = CatchAsync(async (req, res, next) => {

    const { setting_id } = req.params; //req.params {postdata}
    const website_setting = await db.setting.findOne({
        where: {
            meta: "post",
            meta_value: "page",

            setting_id
        }
    })
    const post = await db.post.findAll({
        where: {
            post_setting_id: website_setting.id,
            language: 'en',
        }
    });
    // Prepare the output
    const output = {
        status: true,
        data: post,
        message: ''
    };

    // Send the response
    res.status(200).json(output);
});

exports.index = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    const { page = 0, rowsPerPage = 100, post_setting_id, language } = postData;
    const search = postData?.search ?? {}
    // Calculate the offset for pagination
    const offset = page * rowsPerPage;

    // Build the query parameters
    const buildingParam = {
        where: {
            post_setting_id: post_setting_id,
            language: language,
            ...(search && search.title && {
                title: {
                    [db.Sequelize.Op.like]: `%${search.title}%`,
                },
            }),
            ...(search && search.post_id && {
                id: search.post_id,
            }),
        },
        limit: rowsPerPage,
        offset: offset,
    };

    // Fetch the posts based on the query parameters
    const post = await db.post.findAll(buildingParam);

    // Count the total number of posts for the given conditions
    const count = await db.post.count({
        where: {
            post_setting_id: post_setting_id,
            language: language,
        }
    });

    // Prepare the output
    const output = {
        status: true,
        data: {
            list: post,
            total_count: count,
        },
        message: ''
    };

    // Send the response
    res.status(200).json(output);
});



exports.create = CatchAsync(async (req, res, next) => {
    const postData = req.body;
    let slug = postData.title.replace(/[^a-zA-Z ]/g, "")   // Remove special characters
        .replace(/ /g, "-")            // Replace spaces with hyphens
        .toLowerCase();
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
        status: postData.status,
        updated_by: req.userlogin.id,
    }
    await post.update(datatoUPdate)
    const post_meta_list = [];
    if (postData?.fields) {

        for (const field of postData?.fields) {
            post_meta_list.push((field.meta).trim())
            const check_post_meta = await db.post_meta.findOne({
                where: {
                    meta: (field.meta).trim(),
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
    if (post?.featured_image_id) {
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