const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { Op } = require("sequelize");

const { db } = require("../models");
const { sendResponse } = require("../helpers/functions");
const User = db.models.user;
const Token = db.models.token;
const validate = db.validations.user;

// Find a single story with an id
exports.getUser = (req, res) => {
  User.findByPk(req.user.id)
    .then((data) => {
      delete data["password"];
      return res.status(200).send({
        user: {
          id: data.id,
          name: data.name,
          email: data.email,
        },
      });
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || `Error retrieving user`,
      });
    });
};

exports.createUser = (req, res) => {
  const { error } = validate(req.body);
  let status = 500;
  if (error) return sendResponse(res, 400, error.details[0].message, null);
  User.findOne({
    where: { [Op.or]: [{ email: req.body.email }, { name: req.body.name }] },
  })
    .then(async (data) => {
      if (data) {
        const previousUser = data.dataValues;
        status = 400;
        if (previousUser.name === req.body.name) {
          throw new Error("User name already registered.");
        } else {
          throw new Error("Email already registered.");
        }
      } else {
        user = {
          name: req.body.name,
          password: req.body.password,
          email: req.body.email,
        };
        user.password = await bcrypt.hash(user.password, 10);
        return User.create(user);
      }
    })
    .then((data) => {
      delete data["password"];
      const token = generateAuthToken(data);
      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
      };
      res.header("x-auth-token", token);
      return sendResponse(res, 200, "User added correctly", { user });
    })
    .catch((err) => {
      return sendResponse(res, status, err.message);
    });
};

exports.loginUser = (req, res) => {
  if (!req.body.name || !req.body.password)
    return sendResponse(res, 400, "Fill all fields");
  const { name, password } = req.body;
  User.findOne({ where: { name } })
    .then(async (data) => {
      if (!data) {
        return sendResponse(res, 400, "Wrong username or password.");
      } else {
        if (!bcrypt.compareSync(password, data.dataValues.password)) {
          return sendResponse(res, 400, "Wrong username or password.");
        } else {
          const user = {
            id: data.dataValues.id,
            name: data.dataValues.name,
            email: data.dataValues.email,
          };
          const token = generateAuthToken(user);
          res.header("x-auth-token", token);
          return sendResponse(res, 200, "Login has done correctly", { user });
        }
      }
    })
    .catch((err) => {
      return sendResponse(res, 500, err.message);
    });
};

exports.logoutUser = (req, res) => {
  const { jti, iat, exp } = req.user;
  let currentTime = new Date().getTime();
  currentTime = Math.floor(currentTime / 1000);
  Token.create({ jti, iat, exp, invalidated: currentTime })
    .then(() => {
      return sendResponse(res, 200, "Logged out correctly.");
    })
    .catch((err) => {
      return sendResponse(res, 500, err.message);
    });
};

exports.editUser = (req, res) => {
  const { newPassword, name, email } = req.body;
  const { id } = req.user;

  if (!email && !name) {
    if (!newPassword)
      return sendResponse(res, 400, "Need some field to update");
    else updatePassword(req, res);
  } else {
    let orCondition = [];
    let status = 500;

    if (email) orCondition.push({ email });
    if (name) orCondition.push({ name });
    User.findOne({
      where: {
        [Op.or]: orCondition,
        id: { [Op.not]: id },
      },
    })
      .then((foundUser) => {
        if (foundUser) {
          const previousUser = foundUser.dataValues;
          if (previousUser.name === name) {
            status = 400;
            throw new Error("User name already registered.");
          } else if (previousUser.email === email) {
            status = 400;
            throw new Error("Email already registered.");
          }
        } else {
          updateUser(req, res);
        }
      })
      .catch((err) => {
        return sendResponse(res, status, err.message);
      });
  }
};

const updatePassword = async (req, res) => {
  const { id, email, name } = req.user;
  const { newPassword } = req.body;

  const user = {
    id,
    name,
    email,
  };

  bcrypt
    .hash(newPassword, 10)
    .then((password) => {
      return User.update(
        { password },
        {
          where: { id },
        }
      );
    })
    .then((num) => {
      if (num == 1) {
        return sendResponse(res, 200, "User updated correctly", { user });
      } else {
        throw new Error(`Cannot update user with id=${id}`);
      }
    })

    .catch((err) => {
      return sendResponse(res, 500, err.message);
    });
};

const updateUser = async (req, res) => {
  const { jti, iat, exp, id } = req.user;
  const originalName = req.user.name;
  const originalEmail = req.user.email;
  const { newPassword, name, email } = req.body;

  let password;
  if (newPassword) {
    try {
      password = await bcrypt.hash(newPassword, 10);
    } catch (err) {
      return sendResponse(res, 500, err.message);
    }
  }

  let currentTime = new Date().getTime();
  currentTime = Math.floor(currentTime / 1000);
  Token.create({ jti, iat, exp, invalidated: currentTime })
    .then(() => {
      return User.update(
        { name, email, password },
        {
          where: { id },
        }
      );
    })
    .then((num) => {
      if (num == 1) {
        const user = {
          id,
          name: name ? name : originalName,
          email: email ? email : originalEmail,
        };
        const token = generateAuthToken(user);
        res.header("x-auth-token", token);
        return sendResponse(res, 200, "User updated correctly", { user });
      } else {
        throw new Error(`Cannot update user with id=${id}`);
      }
    })
    .catch((err) => {
      return sendResponse(res, 500, err.message);
    });
};

const generateAuthToken = (user) => {
  const { id, name, email } = user;
  const token = jwt.sign({ id, name, email }, process.env.AUTH_KEY, {
    expiresIn: process.env.EXPIRATION_TOKEN,
    jwtid: uuid(),
  });
  return token;
};

// const crypto = require("crypto");

// crypto.randomBytes(3*4).toString('base64');
