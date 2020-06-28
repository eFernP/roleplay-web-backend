// config/ cloudinary.js

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

var storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "roleplay-web", // The name of the folder in cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
    // filename: (req, file, cb) => {
    //   cb(null, file.originalname); // The file on cloudinary would have the same name as the original file name
    // },
    // size: async (req, file, cb) => {
    //   console.log("FILE SIZE IS: ", file.size, file);
    // },
  },
});

const uploadCloud = multer({
  storage: storage,
  // fileFilter: (req, file, cb) => {
  //   //console.log("FILE SIZE IS: ", file.size, file);
  //   if (file.size > 1000000) {
  //     cb(new Error("Invalid size."));
  //   } else {
  //     cb(null, true);
  //   }
  // },
});

module.exports = uploadCloud;
