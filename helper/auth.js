
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require("../models");
const { Roles } = require("../constants/user");
const md5 = require('md5');
const AppError = require('../utils/appError')
const appconfig = require('../config/appconfig');
const { access_module } = require('../constants/access_module');
const saltRounds = 10;
const crypto = require('crypto');
const CatchAsync = require("../utils/catchAsync");


exports.signToken = (data) => {
    return jwt.sign(data, appconfig.privateKey,
        {
            expiresIn: appconfig.get.clientTokenDuration
        }
    );
}
exports.sendToken = (data, statusCode, res, token_name) => {
    const token = this.signToken(data)
    const date = new Date();
    date.setHours(date.getHours() + 6);
    res.cookie(token_name, token, {
        expires: date,
        //  secure: (config.get('env') == 'prod'), 
        httpOnly: true
    })
    res.status(statusCode).json({
        status: true,
        message: "OTP Verfied",
        data
    })
}

exports.verifyAccessToken = async (token) => {
    try {
        return jwt.verify(token, appconfig.privateKey);

    } catch (ex) {
        return 0
    }
}

const getPermissions = (role) => {
    appconfig.rolePermissions[role]
    if (!appconfig.rolePermissions[role]) {
        throw new AppError(`Authentication Error`, 403)
    }

    return appconfig.rolePermissions[role]
}


exports.checkAccess = (permission) => {
    return async (req, res, next) => {
        //    console.log({ permission, role: req.userlogin.type })
        try {
            const permissions = getPermissions(req.userlogin.type)
            if (!permissions.includes(permission)) {
                throw new AppError('Not authenticated', 403)
            }
        }
        catch (error) {
            return next(error)
        }
        next();
    }
}

exports.checkUserRoleV2 = (permission) => {
    return async (req, res, next) => {
        const roles = req.userlogin.roles
        let flag = false;
        permission.map((data) => {
            if (roles.includes(data)) flag = true
        })
        if (!flag)
            return next(new AppError(`Access Denied`, 403));

        next();
    }
}

exports.checkUserRole = (route_name) => {
    return async (req, res, next) => {
        let flag = false;
        if (access_module[route_name]) {
            const roles = req.userlogin.roles
            /* console.log(roles);
            console.log(access_module[route_name]); */
            access_module[route_name].map((data) => {
                if (roles.includes(data)) flag = true
            })

        }
        //        console.log(flag)
        if (!flag)
            return next(new AppError(`Access Denied`, 403));

        next();
    }
}
exports.verifyVendor = async (req, res, next) => {
    const db = require("../models");
    // console.log(req.userlogin.id);return;
    const vendor_user = await db.vendor_user.findOne({ where: { user_id: req.userlogin.id } });
    if (!vendor_user) return next(new AppError(`Vendor Not Assigned ${req.path}`, 401))

    const vendor = await db.vendor.findOne({ where: { id: vendor_user.vendor_id } });
    if (!vendor)
        return next(new AppError(`Vendor Not found ${req.path}`, 401))

    req.vendor = vendor;
    next();
}


exports.verifyVendorWithItem = async (req, res, next) => {
    const db = require("../models");
    const { item_id } = req.params;
    const item = await db.project_item.findByPk(item_id);
    if (!item) return next(new AppError(`Item does not exist `, 400));

    const vendor_user = await db.vendor_user.findOne({ where: { user_id: req.userlogin.id } });
    if (!vendor_user) return next(new AppError(`Vendor Not Assigned`, 404))
    const vendor = await db.vendor.findOne({ where: { id: vendor_user.vendor_id } });
    if (!vendor)
        return next(new AppError(`Vendor Not found`, 404))

    req.vendor = vendor;
    req.item = item;
    next();
}
exports.verifyVendorWithQuotation = async (req, res, next) => {
    const db = require("../models");
    // console.log(req.userlogin.id);return;
    const { quotation_id } = req.params;
    const vendor_user = await db.vendor_user.findOne({ where: { user_id: req.userlogin.id } });
    if (!vendor_user) return next(new AppError(`Vendor Not Assigned ${req.path}`, 401))

    const vendor = await db.vendor.findOne({ where: { id: vendor_user.vendor_id } });
    if (!vendor)
        return next(new AppError(`Vendor Not found ${req.path}`, 401))

    let vendorData = await db.item_vendor_quotations.findOne({
        where: {
            // vendor_id: id,
            id: quotation_id,
        },

    })
    if (!vendorData)
        return next(new AppError(`Quotation does not exist`, 404))

    if (vendorData.vendor_id != vendor.id)
        return next(new AppError(`Quotation does not belongs to vendor`, 404))

    req.vendor = vendor;
    next();
}
exports.verifyToken = async (req, res, next) => {
    const output = {};
    output['status'] = 401;

    try {
        if (req.cookies.access_token != undefined) {
            const db = require("../models");
            const Users = db.users;
            const access_token = req.cookies.access_token;
            const user = new Users;
            user.token = access_token;
            userlogin = await user.VerifyToken();
            if (userlogin) {
                req.userlogin = userlogin;
                next();
            } else {
                output['message'] = "Acccess Token expired or invalid";
                res.json(output);
                res.end();
            }
        } else {
            output['message'] = "Cookie not set ";
            res.json(output);
            res.end();
        }
    } catch (err) {
        output['message'] = "Acccess Token expired or invalid";
        res.json(output);
        res.end();
    }


}

exports.generatePassword = async (password) => {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password.toString(), salt);
    return hash.toString();
}
exports.generateToken = async ({ id, contact_id, time }) => {
    // used for client quotation
    return md5(id + contact_id + time);
}
exports.verifyPassword = async (password, hash) => {
    return bcrypt.compareSync(password.toString(), hash);
}


exports.getContentType = async (fileExtension) => {
    switch (fileExtension) {
        case 'pdf':
            return 'application/pdf';
        case 'txt':
            return 'text/plain';
        case 'png':
            return 'image/jpeg';
        case 'xml':
            return 'text/xml';
        // Add more cases for other file types
        default:
            return 'application/octet-stream';
    }
}


exports.verifyHubSpotWebhook = CatchAsync(async (req, res, next) => {
    // const receivedPayload = JSON.stringify(req.body)
    // let receivedSignature, computedSignature;
    // try {
    //     receivedSignature = req.get('X-HubSpot-Signature');
    //     computedSignature = crypto.createHash('sha256').update(secretKey + receivedPayload).digest('hex');
    //     console.log({ receivedSignature, computedSignature })
    //     if (!receivedPayload || !receivedSignature || !computedSignature) {
    //         console.log({ receivedPayload, receivedSignature, computedSignature })
    //         throw new Error('Invalid request')
    //     }
    // }
    // catch (error) {
    //     console.log({ error })
    //     throw error
    // }
    // if (receivedSignature !== computedSignature) {
    //     // The payload is not authentic, reject it
    //     console.log('Invalid signature, potential security threat!');
    //     console.log({ receivedPayload })
    //     return res.status(403).send('Invalid signature');
    // }
    return next(); // Continue to the next middleware or route handler
});

exports.verifyTestEmail = async (req, res, next) => {
    next();
}
