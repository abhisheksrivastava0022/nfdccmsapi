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
// .delete(controller.delete)

module.exports = router;