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

  //find an existing user
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

        User.create(user)
          .then((data) => {
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
          })
          .catch((err) => {
            return res
              .status(500)
              .send({ message: err.message || "Error creating the user." });
          });
      }
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "Error retrieving user.",
      });
    });
};

exports.loginUser = (req, res) => {
  if (!req.body.email || !req.body.password)
    return res.status(400).send({ message: "Fill all fields" });
  const { email, password } = req.body;
  //find an existing user
  User.findOne({ where: { email } })
    .then(async (data) => {
      if (!data) {
        return res.status(400).send({
          err: {
            message: "Wrong email or password. (EMAIL)",
          },
        });
      } else {
        const user = data.dataValues;
        if (!bcrypt.compareSync(password, user.password)) {
          return res.status(400).json({
            err: {
              message: "Wrong email or password. (PASSWORD)",
            },
          });
        } else {
          delete user["password"];
          const token = generateAuthToken(user);
          return res.header("x-auth-token", token).send({
            id: data.id,
            name: data.name,
            email: data.email,
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

const generateAuthToken = (user) => {
  const token = jwt.sign(
    { id: user.id, name: user.name },
    process.env.AUTH_KEY,
    {
      expiresIn: process.env.EXPIRATION_TOKEN,
      jwtid: uuid(),
    }
  );
  return token;
};

// const crypto = require("crypto");

// crypto.randomBytes(3*4).toString('base64');
