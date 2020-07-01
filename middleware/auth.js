const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { db } = require("../models");
const Token = db.models.token;

module.exports = (req, res, next) => {
  let currentTime = new Date().getTime();
  currentTime = Math.floor(currentTime / 1000);
  Token.destroy({ where: { exp: { [Op.lt]: currentTime } } })
    .then(() => {
      //get the token from the header if present
      const token =
        req.headers["x-access-token"] || req.headers["authorization"];
      //if no token found, return response (without going to the next middelware)
      if (!token)
        return res
          .status(401)
          .send({ message: "Access denied. No token provided." });

      try {
        //if can verify the token, set req.user and pass to next middleware
        const decoded = jwt.verify(token, process.env.AUTH_KEY);

        // let currentTime = new Date().getTime();
        // currentTime = Math.floor(currentTime / 1000);

        console.log("DECODED", decoded);
        const jti = decoded.jti ? decoded.jti : null;
        Token.findOne({
          where: { jti },
        })
          .then((data) => {
            if (data) {
              return res
                .status(400)
                .send({ message: "Token has been invalidated." });
            } else {
              req.user = decoded;
              next();
            }
          })
          .catch((err) => {
            return res
              .status(500)
              .send({ message: "Error checking token in token list", err });
          });
      } catch (err) {
        //if invalid token
        console.log("TOKEN ERROR", err);
        if ((err.name = "JsonWebTokenError")) {
          return res.status(400).send({ message: "Invalid token.", err });
        }
        if ((err.name = "TokenExpiredError")) {
          return res
            .status(400)
            .send({ message: "Token expired at " + err.expiredAt });
        }
      }
    })
    .catch((err) => {
      return res
        .status(500)
        .send({ message: "Error cleaning token list", err });
    });
};
