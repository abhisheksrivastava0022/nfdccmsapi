const express = require('express');
const router = express.Router();

const postRoute = require('./post');
const menuRoute = require('./menu');
const subscribeRoute = require('./subscribe');

const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const cors = require('cors');

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

router.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));


router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(cookieParser());

router.use("/post", postRoute);
router.use("/menu", menuRoute);
router.use("/subscribe", subscribeRoute);

// router.use((req, res, next) => {
//     next(new AppError(`Can't find ${req.originalUrl} to this server`, 404)); // if we pass any parameter in next then react automatic understand that error occured
// });
module.exports = router;
