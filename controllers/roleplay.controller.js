const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const Joi = require("joi");

const { ROLE_TYPES } = require("../constants");
const { db } = require("../models");
const Roleplay = db.models.roleplay;
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
  //console.log("USER ID IN CREATE", req.user);
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  Roleplay.findOne({
    where: { title: req.body.title },
  })
    .then((data) => {
      if (!data) {
        const roleplay = {
          title: req.body.title,
          description: req.body.description,
          type: req.body.type,
          numParticipants: req.body.numParticipants,
          creator: req.user,
        };

        if (req.file) {
          //console.log("image file", req.file);
          roleplay.background = req.file.path;
        }
        //console.log("roleplay object", roleplay);

        Roleplay.create(roleplay)
          .then((data) => {
            return res.status(200).send({
              message: "Roleplay added correctly",
            });
          })
          .catch((err) => {
            return res
              .status(500)
              .send({ message: err.message || "Error creating the user." });
          });
      } else {
        return res
          .status(400)
          .send({ message: "There is already a roleplay with this name" });
      }
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "Error retrieving roleplay",
      });
    });
};

exports.updateRoleplay = (req, res) => {
  const { id, title, description, type, numParticipants } = req.body;

  const userId = req.user;

  if (!id) {
    return res.status(400).send({
      message: `Missing roleplay id`,
    });
  }

  if (!title && !description && !type && !numParticipants && !req.file) {
    return res.status(400).send({
      message: "Need some field to update",
    });
  }

  Participation.findAll({ roleplay: id })
    .then((participations) => {
      if (numParticipants && participations.length > numParticipants) {
        return res.status(400).send({
          message:
            "Cannot set a number of participants less than the current number of participants",
        });
      } else {
        Roleplay.findOne({
          where: { id, creator: userId },
        })
          .then((rpInstance) => {
            if (rpInstance) {
              const roleplayData = {
                title,
                description,
                type,
                numParticipants,
              };
              const { error } = validateUpdate(roleplayData);
              if (error)
                return res
                  .status(400)
                  .send({ message: error.details[0].message });

              if (req.file) {
                roleplayData.background = req.file.path;
              }
              rpInstance
                .update(roleplayData)
                .then((roleplay) => {
                  return res.status(200).send({
                    message: `Roleplay updated correctly`,
                    roleplay,
                  });
                })
                .catch((err) => {
                  return res.status(500).send({
                    message: `Error updating roleplay with id=${id}`,
                    err,
                  });
                });
            } else {
              return res.status(400).send({
                message: `There is no roleplay with id=${id} created by the user with id=${userId}`,
              });
            }
          })
          .catch((err) => {
            return res.status(500).send({
              message: "Error finding roleplay",
              err,
            });
          });
      }
    })
    .catch((err) => {
      return res.status(500).send({
        message: "Error finding participations",
        err,
      });
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
