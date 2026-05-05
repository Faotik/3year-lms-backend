const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, next) => {
        next(null, 'uploads/');
    },
    filename: (req, file, next) => {
        const uniquePreffix = Date.now() + "-" + Math.floor(Math.random() * 1000000);

        next(null, uniquePreffix + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;