const express = require('express');
const controller = require('../controller/fileController');
const auth = require('../helper/auth');
//const { create, update } = require('../schema/image');
const validation = require('../helper/validation');
let router = express.Router();
//const { route } = require('../constants/access_module');
//const { checkUserRole } = require('../helper/auth');
/* router
    .route("/:id(\\d+)")
    .get(controller.get);
 */
router
    .route("/:id")
    // .all(checkUserRole(route.ERP_IMAGE))
    .post(controller.create)
    .get(controller.list)
    .delete(controller.delete)

router
    .route("/:id(\\d+)")
// .all(checkUserRole(route.ERP_IMAGE))


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
    .route("/profile/:filename")
    .get(async (req, res, next) => {
        let { filename = null, } = req.params;

        if (!filename) {
            // return res.status(404).send('File not found');
            return next(new AppError('File not found', 404));
        }

        const filePath = 'public/profile/' + filename;
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