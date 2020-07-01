const token = (sequelize, Sequelize) => {
  const Token = sequelize.define(
    "token",
    {
      jti: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
      iat: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      exp: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      invalidated: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
    },
    { timestamps: false }
  );
  return Token;
};

exports.token = token;
