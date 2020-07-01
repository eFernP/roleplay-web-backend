const multer = require("multer");
const uploadCloud = require("../config/cloudinary.config");

module.exports = (req, res, next) => {
  console.log("REQ USER IN UPLOAD", req.user);

  const userId = req.user.id;

  const upload = uploadCloud.single("image");
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      return res
        .status(400)
        .send({ message: err.message, allowedFormats: "jpeg, jpg, png" });
    }
    req.user = userId;
    next();
  });
};
