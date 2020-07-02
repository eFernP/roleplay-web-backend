const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { Op } = require("sequelize");

const { db } = require("../models");
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
  if (error) return res.status(400).send({ message: error.details[0].message });

  // if (!req.body.confirmedPassword)
  //   return res
  //     .status(400)
  //     .send({ message: "You have to confirm your password." });

  // if (req.body.confirmedPassword !== req.body.password)
  //   return res.status(400).send({ message: "The passwords do not match." });

  User.findOne({
    where: { [Op.or]: [{ email: req.body.email }, { name: req.body.name }] },
  })
    .then(async (data) => {
      if (data) {
        const previousUser = data.dataValues;
        if (previousUser.name === req.body.name) {
          return res
            .status(400)
            .send({ message: "User name already registered." });
        } else {
          return res.status(400).send({ message: "Email already registered." });
        }
      } else {
        user = {
          name: req.body.name,
          password: req.body.password,
          email: req.body.email,
        };
        user.password = await bcrypt.hash(user.password, 10);

        User.create(user).then((data) => {
          delete data["password"];
          const token = generateAuthToken(data);
          return res.header("x-auth-token", token).send({
            message: "User added correctly",
            user: {
              id: data.id,
              name: data.name,
              email: data.email,
            },
          });
        });
        // .catch((err) => {
        //   return res
        //     .status(500)
        //     .send({ message: err.message || "Error creating the user." });
        // });
      }
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "Error creating user.",
      });
    });
};

exports.loginUser = (req, res) => {
  if (!req.body.name || !req.body.password)
    return res.status(400).send({ message: "Fill all fields" });
  const { name, password } = req.body;
  //find an existing user
  User.findOne({ where: { name } })
    .then(async (data) => {
      if (!data) {
        return res.status(400).send({
          message: "Wrong username or password. (NAME)",
        });
      } else {
        const user = data.dataValues;
        if (!bcrypt.compareSync(password, user.password)) {
          return res.status(400).json({
            message: "Wrong username or password. (PASSWORD)",
          });
        } else {
          delete user["password"];
          const token = generateAuthToken(user);
          return res.header("x-auth-token", token).send({
            id: user.id,
            name: user.name,
            email: user.email,
          });
        }
      }
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "Error retrieving user.",
      });
    });
};

exports.logoutUser = (req, res) => {
  const { jti, iat, exp } = req.user;
  let currentTime = new Date().getTime();
  currentTime = Math.floor(currentTime / 1000);
  Token.create({ jti, iat, exp, invalidated: currentTime })
    .then((data) => {
      //console.log(data);
      return res.status(200).send({
        message: "Logged out correctly.",
      });
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "Error logging out.",
      });
    });
};

exports.editUser = (req, res) => {
  const { newPassword, name, email } = req.body;
  const { id } = req.user;

  if (!name && !email && !newPassword) {
    return res.status(400).send({
      message: "Need some field to update",
    });
  }

  // if (newPassword && !confirmedNewPassword) {
  //   return res.status(400).send({
  //     message: "Need to confirm the new password",
  //   });
  // }
  // if (newPassword && confirmedNewPassword) {
  //   if (newPassword === confirmedNewPassword) {
  //     password = await bcrypt.hash(newPassword, 10);
  //   } else {
  //     return res.status(400).send({
  //       message: "The passwords do not match.",
  //     });
  //   }
  // }

  let orCondition = [];

  if (email) orCondition.push({ email });
  if (name) orCondition.push({ name });

  console.log(email, name, "Variables");

  if (email || name) {
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
            return res
              .status(400)
              .send({ message: "User name already registered." });
          } else if (previousUser.email === email) {
            return res
              .status(400)
              .send({ message: "Email already registered." });
          }
        } else {
          updateUser(req, res);
        }
      })
      .catch((err) => {
        return res.status(500).send({
          message: `Error updating user with id=${id}`,
          err,
        });
      });
  } else {
    updateUser(req, res);
  }
};

const updateUser = async (req, res) => {
  const { jti, iat, exp, id } = req.user;
  const originalName = req.user.name;
  const originalEmail = req.user.email;
  const { newPassword, name, email } = req.body;

  let password;
  console.log("going to crypt password", password);

  if (newPassword) {
    try {
      password = await bcrypt.hash(newPassword, 10);
    } catch (error) {
      return res.status(500).send({
        message: `Error encrypting password`,
      });
    }
  }
  User.update(
    { name, email, password },
    {
      where: { id },
    }
  )
    .then((num) => {
      if (num == 1) {
        const user = {
          id,
          name: name ? name : originalName,
          email: email ? email : originalEmail,
        };
        if (!name && !email) {
          return res.status(200).send({
            message: "User updated correctly",
            user,
          });
        } else {
          let currentTime = new Date().getTime();
          currentTime = Math.floor(currentTime / 1000);
          Token.create({ jti, iat, exp, invalidated: currentTime }).then(() => {
            const token = generateAuthToken(data);
            return res.status(200).header("x-auth-token", token).send({
              message: "User updated correctly",
              user,
            });
          });
        }
      } else {
        return res.status(400).send({
          message: `Cannot update user with id=${id}`,
        });
      }
    })
    .catch((err) => {
      return res.status(500).send({
        message: `Error updating user with id=${id}`,
        err,
      });
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
