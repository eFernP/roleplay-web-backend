const Joi = require("joi");

const offer = (sequelize, Sequelize) => {
  const Offer = sequelize.define("offer", {
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
    message: {
      allowNull: false,
      type: Sequelize.TEXT,
      validate: {
        max: 500,
      },
    },
    available: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });
  return Offer;
};

const validateModel = (model) => {
  const schema = {
    user: Joi.number().required(),
    roleplay: Joi.number().required(),
    message: Joi.string().max(500).required(),
    available: Joi.boolean(),
  };

  return Joi.validate(model, schema);
};

exports.offer = offer;
exports.validate = validateModel;
