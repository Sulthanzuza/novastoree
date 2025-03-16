const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'); 

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
