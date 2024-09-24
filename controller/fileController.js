const db = require("../models");
const CatchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const appconfig = require("../config/appconfig");
const APIFeatures = require("../utils/apiFeature");
const formidable = require('formidable');
const fs = require('fs-extra');
const model = db.gallery;
const sharp = require('sharp');

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
    const form = new formidable.IncomingForm();

    const { newPath, original_name } = await new Promise((resolve, reject) => {
        form.parse(req, async function (err, fields, files1) {
            if (err) {
                reject(err);
                return;
            }

            const files = {};
            files.file = Array.isArray(files1.file) ? files1.file[0] : files1.file;

            if (files?.file?.filepath && files.file.size > 0) {
                const oldPath = files.file.filepath;
                const fileExtension = (files.file.originalFilename).split('.').pop();


                const isImage = await sharp(files.file.filepath)
                    .metadata()
                    .then(() => true)  // If metadata is available, it's an image
                    .catch(() => false); // If sharp throws an error, it's not an image

                // if (isImage) {
                //     console.log("The file is an image.");
                // } else {
                //     console.log("The file is not an image.");
                // }

                const originalFilename = Date.now() + "_" + Math.floor(Math.random() * 10000000) + "." + fileExtension;
                const newPath = "public/file/" + originalFilename;

                try {
                    // Copy the file to the new path
                    await fs.copy(oldPath, newPath);

                    // Check if the file is an image (e.g., jpeg, png, gif)
                    if (isImage) {
                        const sizes = [
                            { width: 400, height: 400, },
                            { width: 1920, height: 1080, },
                            { width: 150, height: 150, },
                        ];

                        for (const size of sizes) {
                            const resizedPath = `public/file/${size.width}_${size.height}/`
                            await fs.ensureDir(resizedPath); // Ensure the directory exists
                            const resizedPathFile = `${resizedPath}${originalFilename}`;

                            // Use sharp to resize the image
                            await sharp(oldPath)
                                .resize(size.width, size.height)
                                .toFile(resizedPathFile);
                        }
                    }

                    // Resolve the promise after processing
                    resolve({ newPath: originalFilename, original_name: files.file.originalFilename });

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

    const output = {
        status: true,
        message: "Upload successfully."
    };
    if (newPath) {
        let data = await model.create({ url: newPath, name: original_name, website_setting_id: id });
        if (!data) return next(new AppError(`Database Error`, 500));
        output.id = data.id;
    }
    // Further logic after file handling (e.g., response to client)
    res.status(200).json(output);
});

// exports.create = CatchAsync(async (req, res, next) => {
//     const { id } = req.params; //req.params {postdata}
//     const form = new formidable.IncomingForm();
//     let originalFilename;

//     const { newPath } = await new Promise((resolve, reject) => {
//         form.parse(req, async function (err, fields, files1) {
//             if (err) {
//                 reject(err);
//                 return;
//             }

//             const files = {};
//             files.file = Array.isArray(files1.file) ? files1.file[0] : files1.file;

//             if (files?.file?.filepath && files.file.size > 0) {
//                 const oldPath = files.file.filepath; // Updated from files.image.filepath
//                // files.file.originalFilename
//                 const fileExtension = (files.file.originalFilename).split('.').pop();
//                 const fileMimeType = mime.lookup(fileExtension); // Get MIME type based on the extension

//                 const originalFilename = Date.now() + "_" + Math.floor(Math.random() * 10000000) + "." + fileExtension; // Updated from files.image.originalFilename
//                 const newPath = "public/file/" + originalFilename;

//                 try {
//                     await fs.copy(oldPath, newPath);

//                     // Check if the file is an image (jpeg, png, gif, etc.)
//                     if (!fileMimeType.startsWith('image/')) {


//                         const sizes = [
//                             { width: 300, height: 300, name: "small" },
//                             { width: 1920, height: 2000, name: "large" },
//                             { width: 500, height: 500, name: "medium" },
//                         ];

//                         for (const size of sizes) {
//                             const resizedPath = `public/file/${size.width}_${size.height}/`
//                             await fs.ensureDir(resizedPath);
//                             const resizedPath1 = `${resizedPath}${size.name}_${originalFilename}`;
//                             await sharp(oldPath)
//                                 .resize(size.width, size.height)
//                                 .toFile(resizedPath1);
//                             //    outputPaths.push(resizedPath); // Store resized file paths
//                         }
//                     }
//                     resolve({ newPath: originalFilename });


//                 } catch (error) {
//                     reject(error);
//                     return;
//                 }
//             } else {
//                 reject(new Error('File not found or is empty'));
//                 return;
//             }
//         });
//     });

//     const output = {
//         status: true,
//         message: "Upload successfully."
//     };
//     if (newPath) {
//         let data = await model.create({ url: newPath, name: newPath, website_setting_id: id });
//         if (!data) return next(new AppError(`Database Error`, 500));
//         output.id = data.id;
//     }


//     res.status(200).json(output);
// });




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
