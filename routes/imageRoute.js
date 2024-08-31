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
    .route("/")
    // .all(checkUserRole(route.ERP_IMAGE))
    .post(controller.create)
    .get(controller.list);

router
    .route("/:id(\\d+)")
    // .all(checkUserRole(route.ERP_IMAGE))
    .delete(controller.delete)

module.exports = router;