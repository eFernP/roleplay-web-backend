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

const validateTag = (tag) => {
  const schema = {
    name: Joi.string().max(50).required(),
  };
  return Joi.validate(tag, schema);
};

exports.tag = tag;
exports.validate = validateTag;
