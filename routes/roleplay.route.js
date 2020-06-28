const roleplays = require("../controllers/roleplay.controller.js");
const auth = require("../middleware/auth");
const upload = require("../middleware/imageStorage");
const uploadCloud = require("../config/cloudinary.config");
var router = require("express").Router();

//router.get("/current", auth, users.getUser);

router.post("/upload", upload, roleplays.uploadBackground);

module.exports = router;
