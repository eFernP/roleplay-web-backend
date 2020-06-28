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
db.models.hasTag = require("../models/hasTag.model").hasTag(
  sequelize,
  Sequelize
);
db.validations.hasTag = require("../models/hasTag.model").validate;

db.models.character = require("../models/character.model").character(
  sequelize,
  Sequelize
);
db.validations.character = require("../models/character.model").validate;

db.models.characterImage = require("../models/characterImage.model").characterImage(
  sequelize,
  Sequelize
);
db.validations.characterImage = require("../models/characterImage.model").validate;

db.models.offer = require("../models/offer.model").offer(sequelize, Sequelize);
db.validations.offer = require("../models/offer.model").validate;

db.models.participatesIn = require("../models/participatesIn.model").participatesIn(
  sequelize,
  Sequelize
);
db.validations.participatesIn = require("../models/participatesIn.model").validate;

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

exports.db = db;
