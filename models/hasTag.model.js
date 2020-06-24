const hasTag = (sequelize, Sequelize) => {
  const HasTag = sequelize.define(
    "hasTag",
    {
      roleplay: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: "roleplays",
        referencesKey: "id",
      },
      tag: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: "tags",
        referencesKey: "id",
      },
    },
    { freezeTableName: true }
  );
  return HasTag;
};

const validateHasTag = (hasTag) => {
  const schema = {
    roleplay: Joi.number().required(),
    tag: Joi.number().required(),
  };
  return Joi.validate(hasTag, schema);
};

exports.hasTag = hasTag;
exports.validate = validateHasTag;
