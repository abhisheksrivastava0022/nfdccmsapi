const CatchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const db = require('../../models');
const Sequelize = require("sequelize");

exports.auth = CatchAsync(async (req, res, next) => {
    next();
})

exports.details = CatchAsync(async (req, res, next) => {
    const { name, language = 'en' } = req.params;

    // Fetch the menu from the database
    let menu
    if (language != '') {
        menu = JSON.parse(JSON.stringify(await db.menu.findOne({
            where: {
                name: (name + "-" + language)
            }
        })));
    }
    if (!menu) {
        menu = JSON.parse(JSON.stringify(await db.menu.findOne({
            where: {
                name
            }
        })));
    }




    if (menu?.payload_data) {
        let payload_data = JSON.parse(menu?.payload_data);

        if (payload_data) {
            // Recursive function to update URLs based on post_id
            const updateUrlsRecursively = async (data) => {
                for (const item of data) {
                    if (item?.post_id) {
                        // Find the post based on post_id and language
                        const post = await db.post.findOne({
                            where: {
                                parent_id: item.post_id,
                                language
                            }
                        });

                        // Update the url if the post has a slug
                        if (post?.slug) {
                            item.url = post.slug;
                        }
                        if (!item.text && language != 'en') {
                            item.text = post.title
                        }

                    }

                    // If there are children, recursively update their URLs
                    if (item?.children && item.children.length > 0) {
                        await updateUrlsRecursively(item.children); // Recursive call
                    }
                }
            };

            // Call the recursive function on the top-level payload_data
            await updateUrlsRecursively(payload_data);
        }

        // Assign the updated payload_data back to the menu
        menu.payload_data = JSON.stringify(payload_data);

    }

    // Create the output response
    const output = {
        status: true,
        data: menu,
        message: ''
    };

    res.status(200).json(output);
});
