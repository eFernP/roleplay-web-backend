const roleplays = require("../controllers/roleplay.controller.js");
const auth = require("../middleware/auth");
const upload = require("../middleware/imageStorage");
const uploadCloud = require("../config/cloudinary.config");
var router = require("express").Router();

//router.get("/current", auth, users.getUser);

router.post("/upload", upload, roleplays.uploadBackground); //TEST

//id, title, description, type (fantasy, sci-fi, futuristic, historical, contemporary, other), numParticipants (entre 2 i 5), ?background(imagen)
router.post("/create", auth, upload, roleplays.createRoleplay);

//id, ?title, ?description, ?type (fantasy, sci-fi, futuristic, historical, contemporary, other), ?numParticipants (entre 2 i 5), ?background(imagen)
router.post("/edit", auth, upload, roleplays.editRoleplay);

module.exports = router;
