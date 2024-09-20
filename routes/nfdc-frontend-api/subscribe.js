const express = require('express');
const validation = require('../../helper/validation');
const controller = require('../../controller/nfdc-frontend-api/subscribeController');
const { subcribe } = require('../../schema/user');
let router = express.Router();

router
    .route("/")
    .post(validation.postCheck(subcribe), controller.create)


module.exports = router;