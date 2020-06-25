const Joi = require("joi");
const { ROLE_TYPES } = require("../constants");

console.log("role types", ROLE_TYPES);

const roleplay = (sequelize, Sequelize) => {
  const Roleplay = sequelize.define("roleplay", {
    title: {
      allowNull: false,
      type: Sequelize.STRING,
      validate: {
        max: 50,
      },
      unique: true,
    },
    description: {
      allowNull: false,
      type: Sequelize.TEXT,
      validate: {
        max: 2000,
      },
    },
    type: {
      allowNull: false,
      type: Sequelize.ENUM,
      values: ROLE_TYPES,
    },
    numParticipants: {
      allowNull: false,
      type: Sequelize.INTEGER,
      validate: { min: 2, max: 5 },
    },
    background: {
      allowNull: true,
      type: Sequelize.STRING,
      validate: { isUrl: true },
    },
    creator: {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
  });
  return Roleplay;
};

const validateModel = (model) => {
  const schema = {
    title: Joi.string().max(50).required(),
    description: Joi.string().max(2000).required(),
    type: Joi.string()
      .valid(...ROLE_TYPES)
      .required(),
    numParticipants: Joi.number().integer().min(2).max(5).required(),
    background: Joi.string().max(255).uri(),
    creator: Joi.number().required(),
  };

  return Joi.validate(model, schema);
};

exports.roleplay = roleplay;
exports.validate = validateModel;
