const express = require('express');
let router = express.Router();
const fs = require('fs');
const AppError = require("../utils/appError");
const path = require('path'); // Import the path module
function getContentType(fileExtension) {
    // Normalize file extension to lowercase
    fileExtension = fileExtension.toLowerCase();

    switch (fileExtension) {
        // Images
        case 'png':
            return 'image/png';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'gif':
            return 'image/gif';
        case 'bmp':
            return 'image/bmp';
        case 'webp':
            return 'image/webp';
        case 'svg':
            return 'image/svg+xml';
        case 'ico':  // Added case for .ico files
            return 'image/x-icon';

        // Videos
        case 'mp4':
            return 'video/mp4';
        case 'webm':
            return 'video/webm';
        case 'ogg':
            return 'video/ogg';
        case 'mov':
            return 'video/quicktime';
        case 'avi':
            return 'video/x-msvideo';
        case 'mkv':
            return 'video/x-matroska';

        // Audio
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        case 'ogg':
            return 'audio/ogg';
        case 'flac':
            return 'audio/flac';
        case 'aac':
            return 'audio/aac';

        // Documents
        case 'pdf':
            return 'application/pdf';
        case 'txt':
            return 'text/plain';
        case 'html':
            return 'text/html';
        case 'css':
            return 'text/css';
        case 'js':
            return 'application/javascript';
        case 'json':
            return 'application/json';
        case 'xml':
            return 'application/xml';
        case 'csv':
            return 'text/csv';
        case 'doc':
        case 'docx':
            return 'application/msword';
        case 'xls':
        case 'xlsx':
            return 'application/vnd.ms-excel';

        // Archives
        case 'zip':
            return 'application/zip';
        case 'rar':
            return 'application/vnd.rar';
        case 'tar':
            return 'application/x-tar';
        case 'gz':
            return 'application/gzip';

        // Fallback
        default:
            return 'application/octet-stream';
    }
}

router
    .route("/download/:filename")
    .get((req, res, next) => {

        let { filename = null } = req.params;

        if (!filename) {
            return next(new AppError('File not found1', 404));
        }
        const filePath = path.join(__dirname, '..', 'public', 'file', filename);
        // console.log(filePath);  // Log the correct file path

        const fileExtension = filename.split('.').pop();
        const contentType = getContentType(fileExtension);
        if (fs.existsSync(filePath)) {
            res.download(filePath, filename, (err) => {
                if (err) {
                    res.status(500).send('Internal Server Error');
                }
            });
        } else {
            return next(new AppError('File not found1', 404));
        }

    });
router
    .route("/:size/:filename")
    .get(async (req, res, next) => {
        let { filename = null, size = null } = req.params;

        if (!filename) {
            return next(new AppError('File not found', 404));
        }

        // Correct the file path by navigating one level up from the 'routes' directory
        const filePath = path.join(__dirname, '..', 'public', 'file', size, filename);

        const fileExtension = filename.split('.').pop();
        const contentType = getContentType(fileExtension);

        // Check if the file exists at the constructed path
        if (fs.existsSync(filePath)) {
            // Set Content-Disposition to inline to display in the browser
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.setHeader('Content-Type', contentType);

            // Create a stream to send the file
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } else {
            return next(new AppError('File not found', 404));
        }
    });



router
    .route("/:filename")
    .get(async (req, res, next) => {
        let { filename = null } = req.params;

        if (!filename) {
            return next(new AppError('File not found', 404));
        }

        // Correct the file path by navigating one level up from the 'routes' directory
        const filePath = path.join(__dirname, '..', 'public', 'file', filename);

        const fileExtension = filename.split('.').pop();
        const contentType = getContentType(fileExtension);

        // Check if the file exists at the constructed path
        if (fs.existsSync(filePath)) {
            // Set Content-Disposition to inline to display in the browser
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.setHeader('Content-Type', contentType);

            // Create a stream to send the file
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } else {
            return next(new AppError('File not found', 404));
        }
    });


module.exports = router;