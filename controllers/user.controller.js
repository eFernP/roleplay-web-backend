const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { db } = require("../models");
const User = db.users;
const validate = db.validateUser;

// Find a single story with an id
exports.getUser = (req, res) => {
  User.findByPk(req.user.id)
    .then((data) => {
      delete data["password"];
      return res.status(200).send(data);
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
            message: "Wrong email or password.",
          },
        });
      } else {
        const user = data.dataValues;
        if (!bcrypt.compareSync(password, user.password)) {
          return res.status(400).json({
            err: {
              message: "Wrong email or password.",
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

const generateAuthToken = (user) => {
  const token = jwt.sign(
    { id: user.id, isAdmin: user.isAdmin },
    process.env.AUTH_KEY
  );
  return token;
};
