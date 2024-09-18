const express = require('express');

const controller = require('../../controller/nfdc-frontend-api/menuController');
let router = express.Router();

router
    .route("/:name/:language")
    .get(controller.details)


module.exports = router;