const winston = require('winston');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors, colorize } = format;

const { Roles } = require('../constants/user')
const dotenv = require("dotenv");
const env_ver = dotenv.config({ path: __dirname + "/../config.env" });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {},
  transports: [
    // 
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

const loggerFormat = combine(
  errors({ stack: true }), // <-- use errors format
  timestamp(),
  format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  printf(({ level, message, timestamp, error, metadata }) => {
    if (error) {
      return `${timestamp} ${level}: ${message} - ${JSON.stringify(metadata)} - ${error.stack}`;
    }
    else if (metadata.error) {
      if (level == 'error') {
        console.log(metadata.error)
        console.log(metadata.error.stack)
      }
      return `${timestamp} ${level}: ${message} - ${JSON.stringify(metadata)} - ${metadata.error.stack}`;
    }
    return `${timestamp} ${level}: ${message} ${JSON.stringify(metadata)}`;
  }),
  colorize({ colors: { info: 'blue', error: 'red', debug: 'green' } }),
  //format.prettyPrint(),
)
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: loggerFormat,
  }));
}
exports.Logger = logger;

let dbConnection;


exports.getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

exports.CMS_DEFAULT_LANGUAGE_CODE = "nl";

exports.currenTimeStamp = function (date) {
  const d = new Date();
  const isoString = d.toISOString();
  const datePart = isoString.split('T')[0];
  const timePart = isoString.split('T')[1].split('.')[0];
  const formattedDate = `${datePart} ${timePart}.000+00`;
  return formattedDate;
}

exports.privateKey = 'keydata';

exports.roles = [
  {
    name: "administrator",
    type: 1, //  means role
    description: "Super user",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "employee",
    type: 1, //  means role
    description: "Super user",
    createdAt: new Date(),
    updatedAt: new Date(),
  },

]

