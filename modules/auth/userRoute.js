const express = require('express');
const controller = require('./auth');
const auth = require('../../helper/auth');
const AppError = require("../../utils/appError");

const {
    create, update, login, changePassword, role, resetPassword,
    verifyToken, changeTokenPassword
} = require('../../schema/user');
const validation = require('../../helper/validation');
let router = express.Router();
const fs = require('fs');

function getContentType(fileExtension) {
    // Add more content types as needed
    switch (fileExtension) {
        case 'pdf':
            return 'application/pdf';
        case 'txt':
            return 'text/plain';
        case 'png':
            return 'image/jpeg';
        // Add more cases for other file types
        default:
            return 'application/octet-stream';
    }
}
router
    .route("/login")
    .post(validation.postCheck(login), controller.login)

router
    .route("/logout")
    .post(controller.logout)

router
    .route("/reset-password")
    .post(validation.postCheck(resetPassword), controller.resetPassword)

router
    .route("/verify-token")
    .post(validation.postCheck(verifyToken), controller.verifyToken)

router
    .route("/change-password")
    .post(validation.postCheck(changeTokenPassword), controller.changePassword)


router
    .route("/:id(\\d+)")
    .patch(validation.postCheck(update), controller.updateUser)
    .delete(controller.delete)
    .get(controller.details)

router
    .route("/:id(\\d+)/deactivate")
    .post(controller.deactivate)

router
    .route("/:id(\\d+)/activate")
    .post(controller.activate)


router
    .route("/")
    .post(validation.postCheck(create), controller.create)

router
    .route("/password/change/")
    .post(validation.postCheck(changePassword), controller.passwordChange)
router
    .route("/update")
    .patch(validation.postCheck(update), controller.update)

router
    .route("/password/change/:id(\\d+)")
    .post(controller.changeUserPassword)


router
    .route('/role')
    .get(controller.role)
    .post(validation.postCheck(role), controller.createRole)

router
    .route('/permission')
    .get(controller.permission)
    .post(validation.postCheck(role), controller.createPermision)

router
    .route('/role/:id(\\d+)')
    .patch(validation.postCheck(role), controller.updateRole)

router
    .route('/vendor-role')
    .get(controller.vendorRole)

router
    .route('/')
    .get(controller.list)

router
    .route('/search')
    .get(controller.search)

router
    .route('/search/:role_id(\\d+)')
    .get(controller.searchWithRole)

router
    .route('/search/auth')
    .get(controller.searchWithRoleAuth)

router
    .route("/profile/:filename")
    .get(async (req, res, next) => {
        let { filename = null, } = req.params;

        if (!filename) {
            // return res.status(404).send('File not found');
            return next(new AppError('File not found', 404));
        }

        const filePath = 'document/profile/' + filename;
        const fileExtension = filename.split('.').pop();
        const contentType = getContentType(fileExtension);

        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Disposition', 'inline; filename=' + filename);
            res.setHeader('Content-Type', contentType);
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        }
        else {
            return next(new AppError('File not found', 404));
        }
    });

module.exports = router;
