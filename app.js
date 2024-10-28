const express = require("express");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError.js");
const globalErrorHandler = require("./controller/errorController.js");
const app = express();
const https = require('https');
const fs = require('fs');
const cors = require('cors');  // Import the CORS middleware
const bodyParser = require('body-parser');

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.11', 'https://192.168.1.11',
    'https://119.82.68.149',
    'http://119.82.68.149',
    'http://192.168.1.82:3000',
    'https://192.168.1.82:3000',
    '192.168.1.82',

];

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', true); // Can't be mask by hacker

const routesRoute = require('./routes/routes.js');
app.use("/api", routesRoute);

const nfdcroutesRoute = require('./routes/nfdc-frontend-api/routes.js');
app.use("/nfdc-web-api", nfdcroutesRoute);

app.get("/", (req, res) => {
    res.json({ status: 200, message: "Api initisalised" });
    res.end();
});


app.use(function (req, res, next) {
    next(new AppError(`Can't find ${req.originalUrl} to this server app`, 404)); // if we pass any parameter in next then react automatic understand that error occured
});
app.use(globalErrorHandler);
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
module.exports = app