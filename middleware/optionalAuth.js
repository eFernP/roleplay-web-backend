const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { db } = require("../models");
const Token = db.models.token;

module.exports = (req, res, next) => {
  let currentTime = new Date().getTime();
  currentTime = Math.floor(currentTime / 1000);
  Token.destroy({ where: { exp: { [Op.lt]: currentTime } } })
    .then(() => {
      const token = req.headers["x-auth-token"] || req.headers["authorization"];
      if (!token) {
        throw new Error("No token");
      }

      const decoded = jwt.verify(token, process.env.AUTH_KEY);
      const jti = decoded.jti ? decoded.jti : null;
      req.user = decoded;
      return Token.findOne({
        where: { jti },
      });
    })
    .then((data) => {
      if (data) {
        throw new Error("Invalidated.");
      } else {
        next();
      }
    })
    .catch((err) => {
      req.user = null;
      if (err.name === "JsonWebTokenError") {
        next();
      } else if (
        err.name === "TokenExpiredError" ||
        err.message === "Invalidated"
      ) {
        req.user.expired = true;
        next();
      } else {
        next();
      }
    });
};
