const Sequelize = require('sequelize')
const Joi = require('joi')
const jwt = require('jsonwebtoken');
const ValidationError = require("../utils/validationError");

const sendErrorDev = (err, res) => {
    /* display error for validation */
    let validation_error = {};
    if (err != undefined && err.errors != undefined) {
        validation_error = err.errors
    }
    /* **end** */
    res.status(err.statusCode).json({
        'status': false,
        // 'status': err.status,
        message: err.message,
        error: err,
        stack: err.stack,
        type: err.type,
        errors: err.errors
    })
}
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        if (err.type === 'ValidationError') {
            res.status(err.statusCode).json({
                status: false,
                type: err.type,
                errors: err.errors
            })
        }
        else {
            res.status(err.statusCode).json({
                status: false,
                message: err.message
            })
        }

        // for unknown error
    } else {
        res.status(500).json({
            status: false,
            message: "Something went very wrong"
        })

    }

}
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    if (err instanceof jwt.TokenExpiredError) {
        err.statusCode = 403;
    }
    if (err instanceof Joi.ValidationError) {
        err = {
            stack: {
                source: 'Joi Validation Error',
                error: err
            },
            ...{
                isOperational: true,
                status: false,
                statusCode: 200,
                type: 'ValidationError',
                errors: err.details.map(({ path, message }) => ({
                    path,
                    message,
                }))
            }
        }
    }
    else if (err instanceof Sequelize.ValidationError) {
        err = {
            ...err,
            stack: err.stack,
            ...{
                isOperational: true,
                status: false,
                statusCode: 200,
                type: 'ValidationError',
                errors: err.errors.map(({ path, message, instance }) => ({
                    path,
                    message,
                    instance: instance.constructor.name
                }))
            }
        }
    }
    else if (err instanceof ValidationError) {
        console.log("working", err);

        err = {
            ...err,
            stack: err.stack,
            ...{
                isOperational: true,
                status: false,
                statusCode: 200,
                type: 'ValidationError',
                errors: err.details
            }
        }
        console.log(err);

    }

    err.status = err.status || 'error';
    if (process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'test') {
        sendErrorDev(err, res)
    } else {
        sendErrorProd(err, res)
    }
}