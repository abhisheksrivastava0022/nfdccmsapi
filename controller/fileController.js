var db = require("../models");
var CatchAsync = require("../utils/catchAsync");
var AppError = require("../utils/appError");
var appconfig = require("../config/appconfig");
const APIFeatures = require("../utils/apiFeature");
var formidable = require('formidable');
var fs = require('fs-extra');
const model = db.gallery;

exports.list = CatchAsync(async (req, res, next) => {
    const { id } = req.params; //req.params {postdata}
    const data = await db.gallery.findAll({
        where: {
            website_setting_id: id
        }
    });
    const output = {
        status: true,
        data,
        message: ""
    };
    res.status(200).json(output);
})
exports.create = CatchAsync(async (req, res, next) => {
    const { id } = req.params; //req.params {postdata}
    var form = new formidable.IncomingForm();
    let originalFilename;

    const { newPath } = await new Promise((resolve, reject) => {
        form.parse(req, async function (err, fields, files1) {
            if (err) {
                reject(err);
                return;
            }

            //  console.log({ data: files1?.file });
            const files = {};
            files.file = Array.isArray(files1.file) ? files1.file[0] : files1.file;

            if (files?.file?.filepath && files.file.size > 0) {
                const oldPath = files.file.filepath; // Updated from files.image.filepath
                const fileExtension = (files.file.originalFilename).split('.').pop();

                const originalFilename = Date.now() + "_" + Math.floor(Math.random() * 10000000) + "." + fileExtension; // Updated from files.image.originalFilename
                const newPath = "public/file/" + originalFilename;

                try {
                    await fs.copy(oldPath, newPath);
                    resolve({ newPath: originalFilename });
                } catch (error) {
                    reject(error);
                    return;
                }
            } else {
                reject(new Error('File not found or is empty'));
                return;
            }
        });
    });

    console.log({ newPath });
    const output = {
        status: true,
        message: "Upload successfully."
    };
    if (newPath) {
        let data = await model.create({ url: newPath, name: newPath, website_setting_id: id });
        if (!data) return next(new AppError(`Database Error`, 500));
        output.id = data.id;
    }


    res.status(200).json(output);
});




exports.delete = CatchAsync(async (req, res, next) => {
    const { id } = req.params; //req.params {postdata}
    const post = await db.gallery.findByPk(id);
    await post.destroy();

    const data = null;
    const output = {
        status: true,
        data,
        message: 'Deleted successfully.'
    }
    res.status(200).json(output);
})
