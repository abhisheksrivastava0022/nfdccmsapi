const express = require("express");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError.js");
const globalErrorHandler = require("./controller/errorController.js");
const userRoute = require("./modules/auth/userRoute.js");
const authController = require("./controller/authController");
const app = express();
const router = express(); // ERP url and Vendor route is same
const https = require('https');
const fs = require('fs');
const cors = require('cors');  // Import the CORS middleware
const bodyParser = require('body-parser');

router.use(cors());

router.use(cors({
    origin: 'http://localhost:3000', // Replace with your React app's URL
    credentials: true // Allow credentials
}));

app.use(cors({
    origin: 'http://localhost:3000', // Replace with your React app's URL
    credentials: true // Allow credentials
}));

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
app.use(cookieParser());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 8080;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('trust proxy', true); // Can't be mask by hacker

const userAfterLogin = require("./routes/user.js");
const dashboardRoutes = require("./routes/dashboard.js");
const settingRoutes = require('./routes/setting.js');
const authenticate = require('./routes/setting.js');
const imageRoute = require("./routes/imageRoute.js");
const postRoute = require('./routes/post.js');
const path = require('path'); // Import the path module

//router.use("/dashboard", dashboardRoutes);
router.use("/auth", userRoute); // authenticate for login will not check;

// authcheck
router.use(authController.authenticate);
router.use('/gallery', express.static(path.join(__dirname, 'public/file')));

router.use("/user", userAfterLogin); // authenticate checked automatic;
router.use("/setting", settingRoutes); // authenticate for login will not check;
router.use("/file", imageRoute);
router.use("/post", postRoute);

app.use("/api", router);


app.get("/", (req, res) => {
    res.json({ status: 200, message: "Api initisalised" });
    res.end();
});
router.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} to this server`, 404)); // if we pass any parameter in next then react automatic understand that error occured
});

app.use(function (req, res, next) {
    next(new AppError(`Can't find ${req.originalUrl} to this server app`, 404)); // if we pass any parameter in next then react automatic understand that error occured
});
router.use(globalErrorHandler);
process.on("unhandledRejection", (err) => {
    console.log(err)
    console.log("Unhandled rejection shuting down..");
    /*  
         server.close(()=>{
             process.exit(1);
         }) 
    */
});

process.on("uncaughtException", (err) => {
    console.log(err.name);
    console.log(err.name, err.message);
    console.log("uncaught Exception not shuting down..");
    /*  
      server.close(()=>{
          process.exit(1);
      })
      */
});
const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};
// app.listen(PORT, () => {
//     console.log(`Listening on port ${PORT}`);
// });

https.createServer(options, app).listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
module.exports = router