const { sendResponse } = require("../helpers/functions");
const { db } = require("../models");
const Participation = db.models.participation;
const Roleplay = db.models.roleplay;

exports.isParticipant = async (req, res, next) => {
  let status = 500;
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      status = 400;
      throw new Error("Need a roleplay id");
    }
    const participation = await Participation.findOne({
      where: { user: req.user.id, roleplay: id },
    });

    if (participation) {
      next();
    } else {
      status = 400;
      throw new Error(
        `This user does not have acces to the roleplay with id=${id}`
      );
    }
  } catch (err) {
    return sendResponse(res, status, err.message);
  }
};

exports.isOwner = async (req, res, next) => {
  let status = 500;
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      status = 400;
      throw new Error("Need a roleplay id");
    }
    const roleplay = await Roleplay.findOne({
      where: { id },
    });

    if (roleplay.dataValues.creator === req.user.id) {
      next();
    } else {
      status = 400;
      throw new Error(
        `User with id=${req.user.id} is not the creator of the roleplay with id=${id}`
      );
    }
  } catch (err) {
    return sendResponse(res, status, err.message);
  }
};
