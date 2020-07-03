const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { db } = require("../models");
const { sendResponse } = require("../helpers/functions");
const Token = db.models.token;

module.exports = (req, res, next) => {
  let status = 500;
  let currentTime = new Date().getTime();
  currentTime = Math.floor(currentTime / 1000);
  Token.destroy({ where: { exp: { [Op.lt]: currentTime } } })
    .then(() => {
      const token = req.headers["x-auth-token"] || req.headers["authorization"];
      console.log("TOKEN ", token);
      if (!token) {
        status = 401;
        throw new Error("Access denied. No token provided.");
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
        status = 400;
        throw new Error("Token has been invalidated.");
      } else {
        next();
      }
    })
    .catch((err) => {
      console.log("ERROR", err);
      if (err.name === "JsonWebTokenError") {
        return sendResponse(res, 400, "Invalid token");
      } else if (err.name === "TokenExpiredError") {
        return sendResponse(res, 400, "Token expired at " + err.expiredAt);
      } else {
        return sendResponse(res, status, err.message);
      }
    });
};
