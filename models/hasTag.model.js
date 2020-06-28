const Joi = require("joi");

const hasTag = (sequelize, Sequelize) => {
  const HasTag = sequelize.define(
    "hasTag",
    {
      roleplay: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "roleplays",
          key: "id",
        },
        unique: "compositeKey",
      },
      tag: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "tags",
          key: "id",
        },
        unique: "compositeKey",
      },
    },
    { freezeTableName: true }
  );
  return HasTag;
};

const validateModel = (model) => {
  const schema = {
    roleplay: Joi.number().required(),
    tag: Joi.number().required(),
  };
  return Joi.validate(model, schema);
};

exports.hasTag = hasTag;
exports.validate = validateModel;
