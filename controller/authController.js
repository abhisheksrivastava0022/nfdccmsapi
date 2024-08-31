const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken')
const AppError = require('../utils/appError')
const appconfig = require('../config/appconfig');

const auth = require('../helper/auth');
const { roles } = require('../constants/access_module');


// const eventContant = require('../constants/event').events;
// const eventEmitter = require('../events/eventEmitter');
exports.logout = catchAsync(async (req, res, next) => {
    res.cookie('jwt', '', {
        expires: new Date(Date.now() + 100),
        secure: (config.get('env') == 'prod'),
        httpOnly: true
    })

    res.status(200).json({
        status: true,
        data: {
            message: "Logout successfull"
        }
    })
})

exports.authenticate = catchAsync(async (req, res, next) => {

    if (!req.cookies.access_token)
        return next(new AppError(`Unauthorized Access ${req.path}`, 401))

    const access_token = req.cookies.access_token
    const datafetch = await auth.verifyAccessToken(access_token);

    if (!datafetch.username)
        return next(new AppError(`Unauthorized Access ${req.path}`, 401))

    const db = require("../models");
    const Users = db.users;

    const user = await Users.findOne({
        attributes: ['id', 'email', 'username'],
        where: {
            username: datafetch.username
        }
    })
    if (!user)
        return next(new AppError(`Unauthorized Access ${req.path}`, 401))

    req.userlogin = user;
    next();
})

exports.authenticateClient = catchAsync(async (req, res, next) => {
    //Skip login page
    const nonSecurePaths = ['/auth/verify-otp', '/auth/generate-otp'];

    if (nonSecurePaths.includes(req.path)) return next();

    if (!req.cookies.client_access_token)
        return next(new AppError(`Unauthorized Access ${req.path}`, 401))


    const access_token = req.cookies.client_access_token;

    const data = await auth.verifyAccessToken(access_token)
    if (!data)
        return next(new AppError(`Unauthorized Access ${req.path}`, 401))

    await statusSync();

    const db = require("../models");
    await db.client_history_login.create({
        user_id: data.contact_id,
        ip_address: req.ip,
        get_param: JSON.stringify(req.query),
        post_param: JSON.stringify(req.body),
        req_url: req.path
    })

    const queryData = req.query;

    if (data.token != queryData.token)
        return next(new AppError(`Mismatched Token `, 401));

    const project_contacts = await db.project_contacts.findOne({
        where: { token: queryData.token }
    });
    if (!project_contacts)
        return next(new AppError(`Invalid login.`, 401));

    req.data = data;
    next();
})

exports.authenticateClientToken = catchAsync(async (req, res, next) => {

    let { token = null } = req.query;
    const db = require("../models");
    const project_contacts = await db.project_contacts.findOne({
        where: { token }
    });
    if (!project_contacts || !token)
        return next(new AppError(`Invalid Request.`, 401));



    const queryData = req.query;
    req.data = {
        contact_id: project_contacts.contact_id,
        project_id: project_contacts.project_id
    };
    next();
})

exports.authenticateClientTokenFile = catchAsync(async (req, res, next) => {

    let { token = null } = req.params;

    const db = require("../models");
    const project_contacts = await db.project_contacts.findOne({
        where: { token }
    });
    if (!project_contacts || !token)
        return next(new AppError(`Invalid Request.`, 401));

    req.data = {
        contact_id: project_contacts.contact_id,
        project_id: project_contacts.project_id
    };
    next();
})


exports.verifyClientToken = catchAsync(async (req, res, next) => {

    let { token = null } = req.params;

    const db = require("../models");
    const project_contacts = await db.project_contacts.findOne({
        where: { token }
    });
    if (!project_contacts || !token)
        return next(new AppError(`Invalid Request.`, 401));

    req.data = {
        contact_id: project_contacts.contact_id,
        project_id: project_contacts.project_id
    };
    next();
})


exports.authenticateCms = catchAsync(async (req, res, next) => {
    //Skip login page

    let access_token = null;
    const cms_access_token = req.headers['cms-access-token'];
    //console.log(req.headers)
    if (!cms_access_token)
        return next(new AppError(`Unauthorized Access ${req.path}`, 401))

    access_token = cms_access_token

    var db = require("../models");
    var Users = db.users;
    var user = new Users;
    user.token = access_token;
    const userlogin = await user.VerifyToken(db);

    if (!userlogin)
        return next(new AppError(`Unauthorized Access ${req.path}`, 401));

    //  if (userlogin.roles.includes(roles.VENDOR))
    //     return next(new AppError(`Vendor assigned unauthorized Access ${req.path}`, 401));

    await db.user_login_history.create({
        user_id: userlogin.id,
        ip_address: req.ip,
        get_param: JSON.stringify(req.query),
        post_param: JSON.stringify(req.body),
        req_url: req.path
    })
    await statusSync();
    req.userlogin = userlogin;
    next();
})