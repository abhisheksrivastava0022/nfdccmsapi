const CatchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const db = require('../../models');
const Sequelize = require("sequelize");

exports.auth = CatchAsync(async (req, res, next) => {
    next();
})
exports.homePage = CatchAsync(async (req, res, next) => {

    // const { setting_id } = req.params; //req.params {postdata}
    const website = await db.setting.findOne({
        where: {
            meta: "website",
            meta_value: "nfdc",

        }
    })
    if (!website) {
        // show error
    }
    const websiteSetting = await db.setting.findOne({
        where: {
            meta: "homePage",
            setting_id: website.id
        }
    })
    if (!websiteSetting) {
        // show error
    }
    const id = websiteSetting.meta_value;
    const post = JSON.parse(JSON.stringify((await db.post.findByPk(websiteSetting.meta_value))));
    if (post.featured_image_id) {
        post.featured_image = await db.gallery.findByPk(post.featured_image_id);
    }
    const postmetaobj = JSON.parse(JSON.stringify((await db.post_meta.findAll({
        attributes: ["meta", "meta_value"],
        where: {
            post_id: id
        }
    }))));
    const post_meta = {};
    if (postmetaobj) {
        for (const meta of postmetaobj) {
            post_meta[meta.meta] = meta.meta_value;
        }
    }
    console.log({ post_meta })
    post.check_other_lang = JSON.parse(JSON.stringify((await db.post.findAll({
        attributes: ["language", "id"],
        where: {
            parent_id: post.parent_id
        }
    }))));
    post.post_meta = post_meta;
    // Prepare the output
    const output = {
        status: true,
        data: post,
        message: ''
    };

    // Send the response
    res.status(200).json(output);
});


exports.getPostsForPosttype = CatchAsync(async (req, res, next) => {

    const { param, language } = req.params; //req.params {postdata}
    const website = await db.setting.findOne({
        where: {
            meta: "website",
            meta_value: "nfdc",

        }
    })
    if (!website) {
        // show error
    }
    const id = websiteSetting.meta_value;
    const websiteSetting = await db.setting.findOne({
        where: {
            meta: "post",
            setting_id: website.id,
            meta_value: param
        }
    })
    if (!websiteSetting) {
        // show error
    }

    const posts = JSON.parse(JSON.stringify((await db.post.findAll(
        {
            where: {
                post_setting_id: websiteSetting.meta_value,
                language
            }
        }
    ))));
    for (const postkey in posts) {
        if (posts[postkey].featured_image_id) {
            posts[postkey].featured_image = await db.gallery.findByPk(posts[postkey].featured_image_id);
        }
        posts[postkey].post_meta = JSON.parse(JSON.stringify((await db.post_meta.findAll({
            attributes: ["meta", "meta_value"],
            where: {
                post_id: id
            }
        }))));
    }

    // Prepare the output
    const output = {
        status: true,
        data: post,
        message: ''
    };

    // Send the response
    res.status(200).json(output);
});
exports.details = CatchAsync(async (req, res, next) => {

    const { slug, language = 'en' } = req.params; //req.params {postdata}

    let post = JSON.parse(JSON.stringify((await db.post.findOne({
        where: {
            slug,
            language
        }
    }))));
    if (!post) {
        post = JSON.parse(JSON.stringify((await db.post.findOne({
            where: {
                slug,
                language
            }
        }))));
    }
    if (post?.featured_image_id) {
        post.featured_image = await db.gallery.findByPk(post.featured_image_id);
    }
    if (post?.id) {
        post.post_meta = JSON.parse(JSON.stringify((await db.post_meta.findAll({
            attributes: ["meta", "meta_value"],
            where: {
                post_id: post.id
            }
        }))));
    }


    // Prepare the output
    const output = {
        status: true,
        data: post,
        message: ''
    };

    // Send the response
    res.status(200).json(output);
});
