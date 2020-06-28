const Joi = require("joi");

const participatesIn = (sequelize, Sequelize) => {
  const ParticipatesIn = sequelize.define(
    "participatesIn",
    {
      user: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "roleplays",
          key: "id",
        },
        unique: "compositeKey",
      },
      roleplay: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "tags",
          key: "id",
        },
        unique: "compositeKey",
      },
      isMaster: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    },
    { freezeTableName: true }
  );
  return ParticipatesIn;
};

const validateModel = (model) => {
  const schema = {
    user: Joi.number().required(),
    roleplay: Joi.number().required(),
    isMaster: Joi.boolean(),
  };
  return Joi.validate(model, schema);
};

exports.participatesIn = participatesIn;
exports.validate = validateModel;
