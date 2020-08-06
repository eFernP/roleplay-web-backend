const roleplays = require("../controllers/roleplay.controller.js");
const auth = require("../middleware/auth");
const upload = require("../middleware/imageStorage");
const uploadCloud = require("../config/cloudinary.config");
const { isParticipant, isOwner } = require("../middleware/permissions.js");
const optionalAuth = require("../middleware/optionalAuth.js");
var router = require("express").Router();

//router.get("/current", auth, users.getUser);

//token, title, description, type (fantasy, sci-fi, futuristic, historical, contemporary, other), numParticipants (entre 2 i 5), ?background(imagen), ?tags (array de strings)
router.post("/create", auth, upload, roleplays.createRoleplay);

//id, ?title, ?description, ?type (fantasy, sci-fi, futuristic, historical, contemporary, other), ?numParticipants (entre 2 i 5), ?background(imagen), ?tags(array de strings)
router.put("/edit", auth, upload, roleplays.editRoleplay);

//token, id
router.get("/roleplay/:id", auth, isParticipant, roleplays.getRoleplayById);

//token
router.get("/myroleplays", auth, roleplays.getUserRoleplays);

//token, id (del roleplay), participantId
router.post(
  "/addparticipant",
  auth,
  isOwner,
  roleplays.addParticipantToRoleplay
);

//token, id (del roleplay), participantId
router.delete(
  "/removeparticipant",
  auth,
  isOwner,
  roleplays.removeParticipantFromRoleplay
);

//token, id
router.get(
  "/participants/:id",
  auth,
  isParticipant,
  roleplays.getRoleplayParticipants
);

//token, id (del roleplay)
router.delete("/removeroleplay", auth, isOwner, roleplays.deleteRoleplay);

//token
router.get("/all", optionalAuth, roleplays.getAllRoleplays);

module.exports = router;
