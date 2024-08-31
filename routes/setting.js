const express = require('express');
//const auth = require('../helper/auth');
const controller = require('../controller/settingController');
const validation = require('../helper/validation');
const { update } = require('../schema/dashboard');
let router = express.Router();
//const { route } = require('../constants/access_module');
//const { checkUserRole } = require('../helper/auth');
router
    .route("/")
    // .all(checkUserRole(route.ERP_ITEM))
    .get(controller.auth, controller.index)
    .post(controller.create)

router
    .route("/:id(\\d+)")
    .get(controller.auth, controller.websiteSetting)
    .delete(controller.delete)
    .patch(controller.update)


module.exports = router;