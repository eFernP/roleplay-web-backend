const jwt = require("jsonwebtoken");
const { Op, or } = require("sequelize");
const Joi = require("joi");

const { ROLE_TYPES } = require("../constants");
const { db } = require("../models");
const { sendResponse } = require("../helpers/functions");
const { compare } = require("bcrypt");
const Roleplay = db.models.roleplay;
const User = db.models.user;
const Tag = db.models.tag;
const Participation = db.models.participation;
const RoleplayTag = db.models.roleplayTag;
//const validate = db.validations.roleplay;

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
  const { error } = validateCreation(req.body);
  if (error) return sendResponse(res, 400, error.details[0].message, null);

  let status = 500;
  let roleplay;
  let tags;

  console.log("TAGS ", req.body.tags);

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
      if (req.body.tags && req.body.tags.length > 0)
        addTags(req.body.tags, roleplay.id);
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

const addTags = (tags, roleplay) => {
  const promises = tags.map((t) => {
    return Tag.findOrCreate({
      where: {
        name: t,
      },
      defaults: {
        name: t,
      },
    }).then((result) => {
      const tag = result[0];
      const created = result[1]; //boolean
      return RoleplayTag.create({ roleplay, tag: tag.id });
    });
  });
  Promise.all(promises).then(() => console.log("ADDED TAGS"));
};

const deleteTags = () => {
  //NO LOS COGE BIEN //////!!!!!!!
  Tag.findAll({
    include: [
      {
        model: Roleplay,
        required: false,
        where: { id: null },
      },
    ],
  }).then((tags) => {
    console.log("TAGS TO DELETE ", tags);
    const ids = tags.map((t) => t.id);
    //return Tag.destroy({ where: { id: ids } });
  });
};

//CONVERTIR EN UPDATE
exports.updateTags = (req, res) => {
  //const { tags } = req.body;
  const { id } = req.body;
  const newTags = req.body.tags;
  let status = 500;
  let arraysOfTags;

  Roleplay.findOne({
    where: { id },
    include: [
      {
        model: Tag,
        attributes: ["name", "id"],
        through: {
          attributes: [],
        },
      },
    ],
  })
    .then((roleplay) => {
      let originalTags = [];
      if (roleplay.dataValues.tags.length > 0) {
        originalTags = roleplay.dataValues.tags;
      }
      arraysOfTags = compareTags(originalTags, newTags);

      if (arraysOfTags.tagsToRemove.length > 0) {
        RoleplayTag.destroy({
          where: { tag: arraysOfTags.tagsToRemove, roleplay: id },
        })
          .then(() => {
            return RoleplayTag.findAll({
              where: { tag: arraysOfTags.tagsToRemove, roleplay: id },
            });
          })
          .then((otherRelations) => {
            if (otherRelations && otherRelations.length > 0) {
              const missingTags = getMissingTags(
                arraysOfTags.tagsToRemove,
                otherRelations
              );
              if (missingTags.length > 0)
                return Tag.destroy({ where: { id: missingTags } });
              else {
                return;
              }
            } else {
              return Tag.destroy({ where: { id: arraysOfTags.tagsToRemove } });
            }
          })
          .then(() => console.log("delete tags without roleplays"));
      }
      return;
    })
    .then(() => {
      if (arraysOfTags.tagsToAdd.length > 0) {
        return addTags(arraysOfTags.tagsToAdd, id);
      }
    })
    .then(() => {
      return sendResponse(res, 200, "Tags changed", arraysOfTags);
    })
    .catch((err) => {
      return sendResponse(res, 500, err.message);
    });
};

const getMissingTags = (tags, relations) => {
  const relationIds = relations.map((r) => {
    return r.tag;
  });
  return tags.filter((t) => {
    if (!relationIds.includes(t)) {
      return t;
    }
  });
};

const compareTags = (originalTags, newTags) => {
  const tagsToAdd = [];
  const tagsToRemove = [];
  const originalNames = [];
  originalTags.forEach((t) => {
    originalNames.push(t.name);
    if (!newTags.includes(t.name)) {
      console.log("TAG TO REMOVE", t);
      tagsToRemove.push(t.id);
    }
  });
  newTags.forEach((t) => {
    if (!originalNames.includes(t)) {
      tagsToAdd.push(t);
    }
  });

  return { tagsToAdd, tagsToRemove };
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
  const { id, title, description, type, numParticipants, tags } = req.body;
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

const validateCreation = (data) => {
  const schema = {
    title: Joi.string().max(50).required(),
    description: Joi.string().max(2000).required(),
    type: Joi.string()
      .valid(...ROLE_TYPES)
      .required(),
    numParticipants: Joi.number().integer().min(2).max(5).required(),
    background: Joi.string().max(255).uri(),
    tags: Joi.array().items(Joi.string()),
  };

  return Joi.validate(data, schema);
};

const validateUpdate = (data) => {
  const schema = {
    title: Joi.string().max(50),
    description: Joi.string().max(2000),
    type: Joi.string().valid(...ROLE_TYPES),
    numParticipants: Joi.number().integer().min(2).max(5),
    tags: Joi.array().items(Joi.string()),
  };

  return Joi.validate(data, schema);
};
