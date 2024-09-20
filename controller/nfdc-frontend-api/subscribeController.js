const CatchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const db = require('../../models');
const Sequelize = require("sequelize");

exports.auth = CatchAsync(async (req, res, next) => {
    next();
})

exports.create = CatchAsync(async (req, res, next) => {

    const { email } = req.body;
    const website = await db.setting.findOne({
        where: {
            meta: "website",
            meta_value: "nfdc",
        }
    });

    const subscribe = await db.subscribe.findOne({
        where: {
            email,
            website_id: website.id
        }
    })
    const output = {
        status: true,
        message: 'Successfully Subsribed'
    };
    if (subscribe) {
        output.status = false;
        output.message = "Already Subsribed";
    } else {
        await db.subscribe.create({
            email,
            website_id: website.id
        })
    }
    res.status(200).json(output);
});
