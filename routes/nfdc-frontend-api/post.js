const express = require('express');
//const auth = require('../helper/auth');
const controller = require('../../controller/nfdc-frontend-api/postController');
const validation = require('../../helper/validation');
const { update } = require('../../schema/dashboard');
let router = express.Router();
//const { route } = require('../constants/access_module');
//const { checkUserRole } = require('../helper/auth');
router
    .route("/:language")
    .get(controller.homePage)
router
    .route("/search/:language")
    .get(controller.search)

router
    .route("/type/:type/:language")
    .get(controller.getPostsForPosttype)

router
    .route("/:slug/:language")
    .get(controller.details)



module.exports = router;