const Joi = require("joi");

const { GENDER_TYPES } = require("../constants");

const character = (sequelize, Sequelize) => {
  const Character = sequelize.define("character", {
    user: {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
    roleplay: {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: "roleplays",
        key: "id",
      },
    },
    name: {
      allowNull: false,
      type: Sequelize.STRING,
      validate: {
        max: 50,
      },
      unique: true,
    },
    age: {
      type: Sequelize.INTEGER,
      validate: { min: 0 },
    },
    gender: {
      type: Sequelize.ENUM,
      values: GENDER_TYPES,
    },
    specie: {
      type: Sequelize.STRING,
      validate: {
        max: 20,
      },
      unique: true,
    },
    profession: {
      type: Sequelize.STRING,
      validate: {
        max: 20,
      },
      unique: true,
    },
    description: {
      type: Sequelize.TEXT,
      validate: {
        max: 2000,
      },
    },
    story: {
      type: Sequelize.TEXT,
      validate: {
        max: 2000,
      },
    },
  });
  return Character;
};

const validateModel = (model) => {
  const schema = {
    user: Joi.number().required(),
    roleplay: Joi.number().required(),
    name: Joi.string().max(50).required(),
    age: Joi.number().integer().min(0),
    gender: Joi.string().valid(...GENDER_TYPES),
    specie: Joi.string().max(20),
    profession: Joi.string().max(20),
    description: Joi.string().max(2000),
    story: Joi.string().max(2000),
  };
  return Joi.validate(model, schema);
};

exports.character = character;
exports.validate = validateModel;
