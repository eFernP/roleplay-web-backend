const Joi = require("joi");

const participation = (sequelize, Sequelize) => {
  const Participation = sequelize.define("participation", {
    // user: {
    //   allowNull: false,
    //   type: Sequelize.INTEGER,
    //   references: {
    //     model: "users",
    //     key: "id",
    //   },
    //   unique: "compositeKey",
    // },
    // roleplay: {
    //   allowNull: false,
    //   type: Sequelize.INTEGER,
    //   references: {
    //     model: "roleplays",
    //     key: "id",
    //   },
    //   unique: "compositeKey",
    // },
    isMaster: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });
  return Participation;
};

const validateModel = (model) => {
  const schema = {
    // user: Joi.number().required(),
    // roleplay: Joi.number().required(),
    isMaster: Joi.boolean(),
  };
  return Joi.validate(model, schema);
};

exports.participation = participation;
exports.validate = validateModel;
