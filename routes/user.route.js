const users = require("../controllers/user.controller.js");
const auth = require("../middleware/auth");
var router = require("express").Router();

router.get("/current", auth, users.getUser);

router.post("/signup", users.createUser);

router.post("/login", users.loginUser);

router.post("/logout", auth, users.logoutUser);

module.exports = router;
