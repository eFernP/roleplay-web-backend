const Joi = require("joi");

const tag = (sequelize, Sequelize) => {
  const Tag = sequelize.define("tag", {
    name: {
      allowNull: false,
      type: Sequelize.STRING,
      validate: {
        max: 50,
      },
      unique: true,
    },
  });
  return Tag;
};

const validateModel = (model) => {
  const schema = {
    name: Joi.string().max(50).required(),
  };
  return Joi.validate(model, schema);
};

exports.tag = tag;
exports.validate = validateModel;
