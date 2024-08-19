const express = require("express");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError.js");
const globalErrorHandler = require("./controller/errorController.js");
const userRoute = require("./modules/auth/userRoute.js");
const app = express();
const router = express(); // ERP url and Vendor route is same


router.use(cookieParser());

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 8080;

app.set('trust proxy', true); // Can't be mask by hacker

const dashboardRoutes = require("./routes/dashboard.js");
const settingRoutes = require('./routes/setting.js');
router.use("/dashboard", dashboardRoutes);
router.use("/user", userRoute); // authenticate for login will not check;
router.use("/setting", settingRoutes); // authenticate for login will not check;



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
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

module.exports = router