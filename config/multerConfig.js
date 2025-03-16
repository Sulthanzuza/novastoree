const fs = require('fs');
const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
