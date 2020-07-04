const Joi = require("joi");
const { MESSAGE_TYPES } = require("../constants");

const roleplayMessage = (sequelize, Sequelize) => {
  const RoleplayMessage = sequelize.define("roleplayMessage", {
    sender: {
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
    message: {
      allowNull: false,
      type: Sequelize.TEXT,
      validate: {
        max: 255,
      },
    },
    type: {
      allowNull: false,
      type: Sequelize.ENUM,
      values: MESSAGE_TYPES,
    },
  });
  return RoleplayMessage;
};

const validateModel = (model) => {
  const schema = {
    sender: Joi.number().required(),
    roleplay: Joi.number().required(),
    message: Joi.string().max(255).required(),
    type: Joi.string()
      .valid(...MESSAGE_TYPES)
      .required(),
  };

  return Joi.validate(model, schema);
};

exports.roleplayMessage = roleplayMessage;
exports.validate = validateModel;
