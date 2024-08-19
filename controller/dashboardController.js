const CatchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");


exports.index = CatchAsync(async (req, res, next) => {

    const output = {
        status: true,
        message: "Address Added successfully"
    }
    res.status(200).json(output);
}) 