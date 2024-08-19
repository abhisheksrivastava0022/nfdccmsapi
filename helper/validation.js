const AppError = require("../utils/appError");
const Joi = require('joi');
exports.postCheck = (schema) => {
    return (req, res, next) => {
        let postdata = { ...req.body };

        const { error, value } = (schema.validate(postdata));

        if (error == undefined) {
            next();
        } else {
            next(error)
        }
    }
}

exports.emptyCheck = (schema) => {
    return (req, res, next) => {
        let postdata = { ...req.body };

        const { error, value } = (Joi.object({

        }).validate(postdata));

        if (error == undefined) {
            next();
        } else {
            next(error)
        }
    }
}

exports.postCheckArray = (schema) => {
    return (req, res, next) => {
        let postdata = req.body;

        const { error, value } = (schema.validate({ data: postdata }));

        if (error == undefined) {
            next();
        } else {
            next(new AppError(error, 400))
        }
    }
}
exports.getCheck = (schema) => {
    return (req, res, next) => {
        const postdata = { ...req.query };
        const { error, value } = (schema.validate(postdata));
        if (error == undefined) {
            next();
        } else {
            next(new AppError(error, 400))
        }
    }
}