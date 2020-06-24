const Joi = require("joi");

const user = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "user",
    {
      name: {
        allowNull: false,
        type: Sequelize.STRING,
        validate: {
          max: 50,
        },
        unique: true,
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING,
        validate: {
          isEmail: true,
          max: 255,
        },
        unique: true,
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING,
        validate: {
          max: 255,
        },
      },
    }
    // {
    //   defaultScope: {
    //     attributes: { exclude: ["password"] },
    //   },
    // }
  );
  return User;
};

const validateUser = (user) => {
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(3).max(255).required(),
  };

  return Joi.validate(user, schema);
};

exports.user = user;
exports.validate = validateUser;
