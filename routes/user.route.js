const users = require("../controllers/user.controller.js");
const auth = require("../middleware/auth");
var router = require("express").Router();

// ruta=> api/users/...

//  token
router.get("/current", auth, users.getUser);

//  email, name, password, confirmedPassword
router.post("/signup", users.createUser);

//  name, password
router.post("/login", users.loginUser);

//  token
router.post("/logout", auth, users.logoutUser);

//  token, name?, email?, newPassword?, confirmedNewPassword
router.post("/edit", auth, users.editUser);

module.exports = router;
