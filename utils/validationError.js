class ValidationError extends Error {
    constructor(message, details = null, statusCode = 200) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = ValidationError