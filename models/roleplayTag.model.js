const Joi = require("joi");

const roleplayTag = (sequelize, Sequelize) => {
  const RoleplayTag = sequelize.define(
    "roleplayTag",
    {},
    // {
    //   roleplay: {
    //     allowNull: false,
    //     type: Sequelize.INTEGER,
    //     references: {
    //       model: "roleplays",
    //       key: "id",
    //     },
    //     unique: "compositeKey",
    //   },
    //   tag: {
    //     allowNull: false,
    //     type: Sequelize.INTEGER,
    //     references: {
    //       model: "tags",
    //       key: "id",
    //     },
    //     unique: "compositeKey",
    //   },
    // },
    { freezeTableName: true }
  );
  return RoleplayTag;
};

const validateModel = (model) => {
  const schema = {
    roleplay: Joi.number().required(),
    tag: Joi.number().required(),
  };
  return Joi.validate(model, schema);
};

exports.roleplayTag = roleplayTag;
exports.validate = validateModel;
