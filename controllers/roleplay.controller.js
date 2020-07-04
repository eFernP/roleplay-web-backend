const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const Joi = require("joi");

const { ROLE_TYPES } = require("../constants");
const { db } = require("../models");
const { sendResponse } = require("../helpers/functions");
const Roleplay = db.models.roleplay;
const User = db.models.user;
const Participation = db.models.participation;

const validate = db.validations.roleplay;

exports.uploadBackground = (req, res) => {
  console.log("request body", req.body);
  if (!req.file)
    return res.status(400).send({ message: "No image were passed." });

  // let file = req.file;
  // let name = file.filename;

  // if (
  //   file.mimetype == "image/jpeg" ||
  //   file.mimetype == "image/png" ||
  //   file.mimetype == "image/gif"
  // ) {
  //   console.log("RECEIVED FILE: ", req.file);
  //   const imgPath = req.file.url;
  //   const imgName = req.file.originalname;

  //   //CONTROL DE TAMAÑO DE IMAGEN -> MENOS DE 10MB
  //   //GUARDAR PATH E IMGNAME EN DB
  // } else {
  //   return res.status(400).send({
  //     message:
  //       "This format is not allowed , please upload file with '.png','.gif','.jpg'",
  //   });
  // }
};

exports.createRoleplay = (req, res) => {
  const { error } = validate(req.body);
  if (error) return sendResponse(res, 400, error.details[0].message, null);

  let status = 500;
  let roleplay;

  Roleplay.findOne({
    where: { title: req.body.title },
  })
    .then((data) => {
      if (!data) {
        const rp = {
          title: req.body.title,
          description: req.body.description,
          type: req.body.type,
          numParticipants: req.body.numParticipants,
          creator: req.user.id,
        };

        if (req.file) {
          rp.background = req.file.path;
        }
        return Roleplay.create(rp);
      } else {
        status = 400;
        throw new Error("There is already a roleplay with this name");
      }
    })
    .then((data) => {
      roleplay = data.dataValues;
      return Participation.create({
        user: req.user.id,
        roleplay: roleplay.id,
      });
    })
    .then(() => {
      return sendResponse(res, 200, "Roleplay added correctly", { roleplay });
    })
    .catch((err) => {
      return sendResponse(res, status, err.message);
    });
};

exports.getRoleplayById = (req, res) => {
  const id = req.params.id;
  let status = 500;
  Participation.findOne({ where: { user: req.user.id, roleplay: id } })
    .then((participation) => {
      if (participation) {
        return Roleplay.findOne({
          where: { id },
        });
      } else {
        status = 400;
        throw new Error(
          `This user does not have acces to the roleplay with id=${id}`
        );
      }
    })
    .then((data) => {
      const roleplay = data.dataValues;
      return sendResponse(res, 200, `Got roleplay with id=${id}`, { roleplay });
    })
    .catch((err) => {
      return sendResponse(res, status, err.message);
    });
};

exports.getUserRoleplays = (req, res) => {
  const user = req.user.id;

  User.findOne({
    where: { id: user },
    include: [
      {
        model: Roleplay,
        through: {
          attributes: ["isMaster"],
        },
      },
    ],
  })
    .then((user) => {
      console.log("USER ", user);
      if (user.dataValues.roleplays.length === 0) {
        return sendResponse(res, 400, "No roleplay were found");
      } else {
        const { roleplays } = user.dataValues;
        return sendResponse(res, 200, "Found roleplays", { roleplays });
      }
    })
    .catch((err) => {
      return sendResponse(res, 500, err.message);
    });
};

exports.editRoleplay = (req, res) => {
  const { id, title, description, type, numParticipants } = req.body;
  const userId = req.user.id;
  let status = 500;

  if (!id) {
    return sendResponse(res, 400, "Missing roleplay id");
  }

  if (!title && !description && !type && !numParticipants && !req.file) {
    return sendResponse(res, 400, "Need some field to update");
  }

  Roleplay.findOne({
    where: { id, creator: userId },
  })
    .then((rpInstance) => {
      if (rpInstance) {
        let roleplayData = {
          title,
          description,
          type,
          numParticipants,
        };
        const { error } = validateUpdate(roleplayData);
        if (error) {
          status = 400;
          throw new Error(error.details[0].message);
        }

        if (req.file) {
          roleplayData.background = req.file.path;
        }
        if (numParticipants) {
          Participation.findAll({ roleplay: id }).then((participations) => {
            if (participations.length > numParticipants) {
              status = 400;
              throw new Error(
                "Cannot set a number of participants less than the current number of participants"
              );
            }
          });
        }
        return rpInstance.update(roleplayData);
      } else {
        status = 400;
        throw new Error(
          `There is no roleplay with id=${id} created by the user with id=${userId}`
        );
      }
    })
    .then((roleplay) => {
      return sendResponse(res, 200, "Roleplay updated correctly", {
        roleplay,
      });
    })
    .catch((err) => {
      return sendResponse(res, status, err.message);
    });
};

const validateUpdate = (model) => {
  const schema = {
    title: Joi.string().max(50),
    description: Joi.string().max(2000),
    type: Joi.string().valid(...ROLE_TYPES),
    numParticipants: Joi.number().integer().min(2).max(5),
  };

  return Joi.validate(model, schema);
};
