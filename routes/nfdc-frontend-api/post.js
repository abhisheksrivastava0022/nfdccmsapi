const express = require('express');
//const auth = require('../helper/auth');
const controller = require('../../controller/nfdc-frontend-api/postController');
const validation = require('../../helper/validation');
const { update } = require('../../schema/dashboard');
let router = express.Router();
//const { route } = require('../constants/access_module');
//const { checkUserRole } = require('../helper/auth');
router
    .route("/")
    .get(controller.homePage)

router
    .route("/:slug/:language")
    .get(controller.details)


module.exports = router;