const Joi = require("joi");
const { PETITION_STATE_TYPES } = require("../constants");

const petition = (sequelize, Sequelize) => {
  const Petition = sequelize.define("petition", {
    // user: {
    //   allowNull: false,
    //   type: Sequelize.INTEGER,
    //   references: {
    //     model: "users",
    //     key: "id",
    //   },
    // },
    // roleplay: {
    //   allowNull: false,
    //   type: Sequelize.INTEGER,
    //   references: {
    //     model: "roleplays",
    //     key: "id",
    //   },
    // },
    message: {
      allowNull: false,
      type: Sequelize.TEXT,
      validate: {
        max: 500,
      },
    },
    state: {
      allowNull: false,
      type: Sequelize.ENUM,
      values: PETITION_STATE_TYPES,
    },
  });
  return Petition;
};

const validateModel = (model) => {
  const schema = {
    user: Joi.number().required(),
    roleplay: Joi.number().required(),
    message: Joi.string().max(500).required(),
    state: Joi.string()
      .valid(...PETITION_STATE_TYPES)
      .required(),
  };

  return Joi.validate(model, schema);
};

exports.petition = petition;
exports.validate = validateModel;
