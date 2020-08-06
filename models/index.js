const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: false,

    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.models = {};
db.validations = {};

db.models.user = require("../models/user.model").user(sequelize, Sequelize);
db.validations.user = require("../models/user.model").validate;
db.models.roleplay = require("../models/roleplay.model").roleplay(
  sequelize,
  Sequelize
);
db.validations.roleplay = require("../models/roleplay.model").validate;
db.models.tag = require("../models/tag.model").tag(sequelize, Sequelize);
db.validations.tag = require("../models/tag.model").validate;
db.models.roleplayTag = require("../models/roleplayTag.model").roleplayTag(
  sequelize,
  Sequelize
);
db.validations.roleplayTag = require("../models/roleplayTag.model").validate;

db.models.character = require("../models/character.model").character(
  sequelize,
  Sequelize
);
db.validations.character = require("../models/character.model").validate;

// db.models.characterImage = require("../models/characterImage.model").characterImage(
//   sequelize,
//   Sequelize
// );
// db.validations.characterImage = require("../models/characterImage.model").validate;

db.models.offer = require("../models/offer.model").offer(sequelize, Sequelize);
db.validations.offer = require("../models/offer.model").validate;

db.models.participation = require("../models/participation.model").participation(
  sequelize,
  Sequelize
);
db.validations.participation = require("../models/participation.model").validate;

db.models.petition = require("../models/petition.model").petition(
  sequelize,
  Sequelize
);
db.validations.petition = require("../models/petition.model").validate;

db.models.roleplayMessage = require("../models/roleplayMessage.model").roleplayMessage(
  sequelize,
  Sequelize
);
db.validations.roleplayMessage = require("../models/roleplayMessage.model").validate;

db.models.roleplayImage = require("../models/roleplayImage.model").roleplayImage(
  sequelize,
  Sequelize
);
db.validations.roleplayImage = require("../models/roleplayImage.model").validate;

db.models.token = require("../models/token.model").token(sequelize, Sequelize);

//ASSOCIATIONS

db.models.roleplay.belongsToMany(db.models.user, {
  through: db.models.participation,
  foreignKey: "roleplay",
});

db.models.user.belongsToMany(db.models.roleplay, {
  through: db.models.participation,
  foreignKey: "user",
});

// db.models.character.belongsTo(db.models.roleplay, {
//   through: db.models.participation,
//   foreignKey: "character",
// });

db.models.roleplay.belongsTo(db.models.user, {
  foreignKey: "creatorId",
  as: "creator",
});

db.models.roleplay.belongsToMany(db.models.tag, {
  foreignKey: "roleplay",
  through: db.models.roleplayTag,
});

db.models.tag.belongsToMany(db.models.roleplay, {
  foreignKey: "tag",
  through: db.models.roleplayTag,
});

db.models.character.belongsTo(db.models.user, {
  foreignKey: "userId",
});

db.models.character.belongsTo(db.models.roleplay, {
  foreignKey: "roleplayId",
});

db.models.offer.belongsTo(db.models.roleplay, {
  foreignKey: "roleplayId",
});

db.models.petition.belongsTo(db.models.user, {
  foreignKey: "userId",
});

db.models.petition.belongsTo(db.models.roleplay, {
  foreignKey: "roleplayId",
});

db.models.roleplayImage.belongsTo(db.models.user, {
  foreignKey: "senderId",
  alias: "sender",
});

db.models.roleplayImage.belongsTo(db.models.roleplay, {
  foreignKey: "roleplayId",
});

db.models.roleplayMessage.belongsTo(db.models.user, {
  foreignKey: "senderId",
  alias: "sender",
});

db.models.roleplayMessage.belongsTo(db.models.roleplay, {
  foreignKey: "roleplayId",
});

exports.db = db;
