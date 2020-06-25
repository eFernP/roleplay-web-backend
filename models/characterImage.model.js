const Joi = require("joi");

const characterImage = (sequelize, Sequelize) => {
  const CharacterImage = sequelize.define("characterImage", {
    character: {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: "characters",
        key: "id",
      },
      unique: true,
    },
    url: {
      allowNull: false,
      type: Sequelize.STRING,
      validate: { isUrl: true },
    },
  });
  return CharacterImage;
};

const validateModel = (model) => {
  const schema = {
    character: Joi.number().required(),
    url: Joi.string().max(255).uri().required(),
  };

  return Joi.validate(model, schema);
};

exports.characterImage = characterImage;
exports.validate = validateModel;
