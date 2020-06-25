const Joi = require("joi");

const roleplayImage = (sequelize, Sequelize) => {
  const RoleplayImage = sequelize.define("roleplayImage", {
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
    url: {
      allowNull: false,
      type: Sequelize.STRING,
      validate: { isUrl: true },
    },
    title: {
      allowNull: true,
      type: Sequelize.STRING,
      validate: {
        max: 50,
      },
    },
  });
  return RoleplayImage;
};

const validateModel = (model) => {
  const schema = {
    user: Joi.number().required(),
    roleplay: Joi.number().required(),
    url: Joi.string().max(255).uri().required(),
    title: Joi.string().max(50),
  };

  return Joi.validate(model, schema);
};

exports.roleplayImage = roleplayImage;
exports.validate = validateModel;
