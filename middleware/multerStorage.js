const multer = require("multer");

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

//exports.upload = multer({ storage: storage });
exports.upload = multer({
  dest: "public/images/",
  fileFilter: (req, file, cb) => {},
});
