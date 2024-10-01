const CatchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const db = require('../../models');
const Sequelize = require("sequelize");
const { Op } = require('sequelize');

exports.auth = CatchAsync(async (req, res, next) => {
    next();
})
exports.homePage = CatchAsync(async (req, res, next) => {
    const { language = 'en' } = req.params; //req.params {postdata}
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
    const post = JSON.parse(JSON.stringify((await db.post.findOne({
        where: {
            parent_id: websiteSetting.meta_value,
            language
        }
    }))));


    if (post?.featured_image_id) {
        post.featured_image = await db.gallery.findByPk(post.featured_image_id);
    }
    const postmetaobj = JSON.parse(JSON.stringify((await db.post_meta.findAll({
        attributes: ["meta", "meta_value"],
        where: {
            post_id: post.id
        }
    }))));
    const post_meta = {};
    if (postmetaobj) {
        for (const meta of postmetaobj) {
            post_meta[meta.meta] = meta.meta_value;
        }
    }
    post.check_other_lang = JSON.parse(JSON.stringify((await db.post.findAll({
        attributes: ["language", "id"],
        where: {
            parent_id: post.parent_id
        }
    }))));
    post.post_meta = post_meta;
    const output = {
        status: true,
        data: post,
        message: ''
    };

    res.status(200).json(output);
});
exports.getPostsForPosttype = CatchAsync(async (req, res, next) => {
    const { type, language } = req.params; // Extract post type and language from request params
    const { page = 1, limit = 10 } = req.query; // Extract page and limit from query, with default values
    const query = req.query;
    // Find website setting
    const website = await db.setting.findOne({
        where: {
            meta: "website",
            meta_value: "nfdc",
        }
    });

    if (!website) {
        return res.status(404).json({
            status: false,
            message: "Website not found"
        });
    }

    const websiteSetting = await db.setting.findOne({
        where: {
            meta: "post",
            setting_id: website.id,
            meta_value: type
        }
    });

    if (!websiteSetting) {
        return res.status(404).json({
            status: false,
            message: "Post setting not found"
        });
    }

    const offset = (page - 1) * limit; // Calculate offset

    // Find posts with pagination
    const where = {
        status: 1,
        post_setting_id: websiteSetting.id,
        language
    }
    if (query?.title) {
        // Use LIKE query for title with wildcard characters
        where.title = { [Op.like]: `%${query.title}%` };

    }
    let postMetaWhere = null;
    if (query?.tendor_number) {
        postMetaWhere = {
            meta: 'tendor_number',
            meta_value: query.tendor_number,
        };
    }
    let include = null;
    if (postMetaWhere) {
        include = [{
            model: db.post_meta,
            as: 'post_meta', // Use the appropriate alias if you've defined one
            where: postMetaWhere,
            required: true // Ensures only posts with matching post_meta are returned
        }]
    }
    const posts = JSON.parse(JSON.stringify(
        await db.post.findAll({
            include,
            where,
            limit: parseInt(limit), // Set limit per page
            offset: parseInt(offset), // Set offset for pagination
            order: [['createdAt', 'DESC']]
        })
    ));

    // Fetch additional data for each post
    for (const postkey in posts) {
        if (posts[postkey].featured_image_id) {
            posts[postkey].featured_image = await db.gallery.findByPk(posts[postkey].featured_image_id);
        }

        const postmetaobj = JSON.parse(JSON.stringify(
            await db.post_meta.findAll({
                attributes: ["meta", "meta_value"],
                where: {
                    post_id: posts[postkey].id
                }
            })
        ));

        const post_meta = {};
        if (postmetaobj) {
            for (const meta of postmetaobj) {
                post_meta[meta.meta] = meta.meta_value;
            }
        }
        posts[postkey].post_meta = post_meta;
    }

    // Prepare pagination information
    const totalPosts = await db.post.count({
        include,
        where,
        limit: parseInt(limit), // Set limit per page
        offset: parseInt(offset), // Set offset for pagination
        order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(totalPosts / limit);

    // Prepare the output with pagination details
    const output = {
        status: true,
        data: posts,
        pagination: {
            totalPosts,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit)
        },
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
            language,
            status: 1,
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
        const postmetaobj = JSON.parse(JSON.stringify(
            await db.post_meta.findAll({
                attributes: ["meta", "meta_value"],
                where: {
                    post_id: post.id,

                }
            })
        ));

        const post_meta = {};
        if (postmetaobj) {
            for (const meta of postmetaobj) {
                post_meta[meta.meta] = meta.meta_value;
            }
        }
        post.post_meta = post_meta;

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

exports.search = CatchAsync(async (req, res, next) => {
    const { type, language } = req.params; // Extract post type and language from request params
    const { page = 1, limit = 10 } = req.query; // Extract page and limit from query, with default values
    const query = req.query;
    // Find website setting
    const website = await db.setting.findOne({
        where: {
            meta: "website",
            meta_value: "nfdc",

        }
    });

    if (!website) {
        return res.status(404).json({
            status: false,
            message: "Website not found"
        });
    }

    const websiteSettings = await db.setting.findAll({
        where: {
            meta: "post",
            setting_id: website.id,
            //   meta_value: type
        }
    });
    const post_setting_id = [];
    if (websiteSettings) {
        for (const websiteSetting of websiteSettings) {
            post_setting_id.push(websiteSetting.id);
        }
    }


    const offset = (page - 1) * limit; // Calculate offset

    // Find posts with pagination
    const where = {
        status: 1,
        post_setting_id: post_setting_id,
        language
    }
    if (query?.title) {
        // Use LIKE query for title with wildcard characters
        where.title = { [Op.like]: `%${query.title}%` };

    }
    let postMetaWhere = null;
    if (query?.tendor_number) {
        postMetaWhere = {
            meta: 'tendor_number',
            meta_value: query.tendor_number,
        };
    }
    let include = null;
    if (postMetaWhere) {
        include = [{
            model: db.post_meta,
            as: 'post_meta', // Use the appropriate alias if you've defined one
            where: postMetaWhere,
            required: true // Ensures only posts with matching post_meta are returned
        }]
    }
    const posts = JSON.parse(JSON.stringify(
        await db.post.findAll({
            include,
            where,
            limit: parseInt(limit), // Set limit per page
            offset: parseInt(offset), // Set offset for pagination
            order: [['createdAt', 'DESC']]
        })
    ));

    // Fetch additional data for each post
    for (const postkey in posts) {
        if (posts[postkey].featured_image_id) {
            posts[postkey].featured_image = await db.gallery.findByPk(posts[postkey].featured_image_id);
        }

        const postmetaobj = JSON.parse(JSON.stringify(
            await db.post_meta.findAll({
                attributes: ["meta", "meta_value"],
                where: {
                    post_id: posts[postkey].id
                }
            })
        ));

        const post_meta = {};
        if (postmetaobj) {
            for (const meta of postmetaobj) {
                post_meta[meta.meta] = meta.meta_value;
            }
        }
        posts[postkey].post_meta = post_meta;
    }

    // Prepare pagination information
    const totalPosts = await db.post.count({
        include,
        where,
        limit: parseInt(limit), // Set limit per page
        offset: parseInt(offset), // Set offset for pagination
        order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(totalPosts / limit);

    // Prepare the output with pagination details
    const output = {
        status: true,
        data: posts,
        pagination: {
            totalPosts,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit)
        },
        message: ''
    };

    // Send the response
    res.status(200).json(output);
});