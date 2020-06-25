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

db.models.users = require("../models/user.model").user(sequelize, Sequelize);
db.validations.users = require("../models/user.model").validate;
db.models.roleplays = require("../models/roleplay.model").roleplay(
  sequelize,
  Sequelize
);
db.validations.roleplays = require("../models/roleplay.model").validate;
db.models.tags = require("../models/tag.model").tag(sequelize, Sequelize);
db.validations.tags = require("../models/tag.model").validate;
db.models.hasTag = require("../models/hasTag.model").hasTag(
  sequelize,
  Sequelize
);
db.validations.hasTag = require("../models/hasTag.model").validate;

db.models.characters = require("../models/character.model").character(
  sequelize,
  Sequelize
);
db.validations.characters = require("../models/character.model").validate;

db.models.characterImages = require("../models/characterImage.model").characterImage(
  sequelize,
  Sequelize
);
db.validations.characterImages = require("../models/characterImage.model").validate;

db.models.offers = require("../models/offer.model").offer(sequelize, Sequelize);
db.validations.offers = require("../models/offer.model").validate;

db.models.participatesIn = require("../models/participatesIn.model").participatesIn(
  sequelize,
  Sequelize
);
db.validations.participatesIn = require("../models/participatesIn.model").validate;

db.models.petitions = require("../models/petition.model").petition(
  sequelize,
  Sequelize
);
db.validations.petitions = require("../models/petition.model").validate;

db.models.roleplayMessages = require("../models/roleplayMessage.model").roleplayMessage(
  sequelize,
  Sequelize
);
db.validations.roleplayMessages = require("../models/roleplayMessage.model").validate;

db.models.roleplayImages = require("../models/roleplayImage.model").roleplayImage(
  sequelize,
  Sequelize
);
db.validations.roleplayImages = require("../models/roleplayImage.model").validate;

exports.db = db;
