const express = require('express');
const router = express.Router();
const authController = require("../controller/authController");
const userAfterLogin = require("./user.js");
const settingRoutes = require('./setting.js');
const imageRoute = require("./imageRoute.js");
const postRoute = require('./post.js');
const menuRoute = require('./menu.js');
const fileReadRoute = require('./gallery.js');
const userRoute = require("./../modules/auth/userRoute.js");
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const cors = require('cors');

const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://192.168.1.11',
    'https://192.168.1.11'

    , 'https://119.82.68.149',
    'http://119.82.68.149',
    'http://192.168.1.82:3000',
    'https://192.168.1.82:3000',
    '192.168.1.82',
];

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

// post data we can read
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(cookieParser());

router.use("/auth", userRoute);
router.use("/gallery", fileReadRoute);
router.use(authController.authenticate);
//router.use('/gallery', express.static(path.join(__dirname, 'public/file')));
router.use("/user", userAfterLogin);
router.use("/setting", settingRoutes);
router.use("/file", imageRoute);
router.use("/post", postRoute);
router.use("/menu", menuRoute);

// router.use((req, res, next) => {
//     next(new AppError(`Can't find ${req.originalUrl} to this server`, 404)); // if we pass any parameter in next then react automatic understand that error occured
// });
module.exports = router;
