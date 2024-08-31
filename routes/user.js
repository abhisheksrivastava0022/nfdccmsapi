const express = require('express');
const controller = require('../modules/auth/auth');
const auth = require('../helper/auth');
const AppError = require("../utils/appError");

const {
    create, update, login, changePassword, role, resetPassword,
    verifyToken, changeTokenPassword
} = require('../schema/user');
const validation = require('../helper/validation');
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
    .route("/")
    .get(controller.detailUserLogin)
    .post(controller.create)

router
    .route("/logout")
    .post(controller.logout)

router
    .route("/list")
    .get(controller.list)

router
    .route("/:id(\\d+)")
    .delete(controller.delete)
    .get(controller.details)
    .patch(controller.update)

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
