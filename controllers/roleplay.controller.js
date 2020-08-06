const jwt = require("jsonwebtoken");
const { Op, or, Sequelize } = require("sequelize");
const Joi = require("joi");

const { ROLE_TYPES } = require("../constants");
const { db } = require("../models");
const { sendResponse } = require("../helpers/functions");
const { compare } = require("bcrypt");
const { roleplay } = require("../models/roleplay.model");
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
          creatorId: req.user.id,
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

exports.editRoleplay = async (req, res) => {
  try {
    const { id, title, description, type, numParticipants, tags } = req.body;
    const userId = req.user.id;
    let status = 500;

    let roleplay;

    if (!id) {
      return sendResponse(res, 400, "Missing roleplay id");
    }

    if (
      !title &&
      !description &&
      !type &&
      !numParticipants &&
      !tags &&
      !req.file
    ) {
      return sendResponse(res, 400, "Need some field to update");
    }

    const rpInstance = await Roleplay.findOne({
      where: { id, creatorId: userId },
    });

    if (rpInstance) {
      let roleplayData = {
        title,
        description,
        type,
        numParticipants,
        tags,
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
        const participations = await Participation.findAll({ roleplay: id });

        if (participations.length > numParticipants) {
          status = 400;
          throw new Error(
            "Cannot set a number of participants less than the current number of participants"
          );
        }
      }
      const rp = await rpInstance.update(roleplayData);
      roleplay = rp;

      if (tags && tags.length > 0) {
        console.log("UPDATE TAAGS");
        await updateTags(tags, id);
      }

      roleplay.dataValues.tags = tags ? tags : [];
      return sendResponse(res, 200, "Roleplay updated correctly", {
        roleplay,
      });
    } else {
      status = 400;
      throw new Error(
        `There is no roleplay with id=${id} created by the user with id=${userId}` ///MIDDLEWARE??
      );
    }
  } catch (err) {
    return sendResponse(res, status, err.message);
  }
};

const updateTags = async (newTags, id) => {
  let arraysOfTags;
  const roleplay = await Roleplay.findOne({
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
  });

  let originalTags = [];
  if (roleplay.dataValues.tags.length > 0) {
    originalTags = roleplay.dataValues.tags;
  }
  arraysOfTags = compareTags(originalTags, newTags);
  if (arraysOfTags.tagsToRemove.length > 0) {
    await RoleplayTag.destroy({
      where: { tag: arraysOfTags.tagsToRemove, roleplay: id },
    });

    const otherRelations = await RoleplayTag.findAll({
      where: { tag: arraysOfTags.tagsToRemove, roleplay: id },
    });

    if (otherRelations && otherRelations.length > 0) {
      const missingTags = getMissingTags(
        arraysOfTags.tagsToRemove,
        otherRelations
      );
      if (missingTags.length > 0)
        await Tag.destroy({ where: { id: missingTags } });
    } else {
      await Tag.destroy({ where: { id: arraysOfTags.tagsToRemove } });
    }
  }
  if (arraysOfTags.tagsToAdd.length > 0) {
    await addTags(arraysOfTags.tagsToAdd, id);
  }
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
  return Promise.all(promises);
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

  if (originalTags) {
    originalTags.forEach((t) => {
      originalNames.push(t.name);
      if (!newTags.includes(t.name)) {
        tagsToRemove.push(t.id);
      }
    });
  }
  if (newTags) {
    newTags.forEach((t) => {
      if (!originalNames.includes(t)) {
        tagsToAdd.push(t);
      }
    });
  }

  return { tagsToAdd, tagsToRemove };
};

exports.getRoleplayById = async (req, res) => {
  let status = 500;
  try {
    const id = req.params.id;
    const data = await Roleplay.findOne({
      where: { id },
      include: [
        {
          model: Tag,
          attributes: ["name"],
          through: {
            attributes: [],
          },
        },
      ],
    });
    const roleplay = data.dataValues;
    const tags = roleplay.tags.map((t) => t.name);
    roleplay.tags = tags;
    return sendResponse(res, 200, `Got roleplay with id=${id}`, { roleplay });
  } catch (err) {
    return sendResponse(res, status, err.message);
  }
};

exports.getUserRoleplays = (req, res) => {
  const id = req.user.id;
  if (!id) {
    status = 400;
    throw new Error("Need a roleplay id");
  }

  User.findOne({
    where: { id },
    include: [
      {
        model: Roleplay,
        include: [
          {
            model: Tag,
            attributes: ["name"],
            through: {
              attributes: [],
            },
          },
        ],
        through: {
          attributes: ["isMaster"],
        },
      },
    ],
  })
    .then((user) => {
      if (user.dataValues.roleplays.length === 0) {
        return sendResponse(res, 400, "No roleplay were found");
      } else {
        const rps = user.dataValues.roleplays;
        let roleplays = [];
        rps.forEach((r) => {
          if (r.tags.length > 0) {
            const tags = r.tags.map((t) => t.name);
            r.dataValues.tags = tags;
          }
          roleplays.push(r.dataValues);
        });
        return sendResponse(res, 200, "Found roleplays", { roleplays });
      }
    })
    .catch((err) => {
      return sendResponse(res, 500, err.message);
    });
};

exports.getRoleplayParticipants = async (req, res) => {
  let status = 500;
  try {
    const { id } = req.params;
    if (!id) {
      status = 400;
      throw new Error("Need a roleplay id");
    }
    const roleplay = await Roleplay.findOne({
      where: { id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
          through: {
            attributes: ["isMaster"],
          },
        },
      ],
    });
    const participations = roleplay.dataValues.users.map((u) => {
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        isMaster: u.participation.isMaster,
      };
    });
    return sendResponse(res, 200, "Got participants", participations);
  } catch (err) {
    return sendResponse(res, 500, err.message);
  }
};

exports.addParticipantToRoleplay = async (req, res) => {
  let status = 500;
  try {
    const { id, participantId } = req.body;
    if (!participantId) {
      status = 400;
      throw new Error("Need a participant id");
    }
    await userExists(participantId);
    const result = await Participation.findOrCreate({
      where: {
        user: participantId,
        roleplay: id,
      },
      defaults: { user: participantId, roleplay: id },
    });
    const created = result[1];
    if (created) {
      return sendResponse(res, 200, "Participant added correctly.");
    } else {
      status = 400;
      throw new Error("The given user already participates in the roleplay");
    }
  } catch (err) {
    return sendResponse(res, status, err.message);
  }
};

exports.removeParticipantFromRoleplay = async (req, res) => {
  let status = 500;
  try {
    const { id, participantId } = req.body;
    if (!participantId) {
      status = 400;
      throw new Error("Need a participant id");
    }
    await userExists(participantId);
    if (participantId === req.user.id) {
      status = 400;
      throw new Error("Cannot removed the user creator");
    }
    const result = await Participation.destroy({
      where: {
        user: participantId,
        roleplay: id,
      },
    });
    if (result === 0) {
      status = 400;
      throw new Error("The given user does not participate in the roleplay");
    }
    return sendResponse(res, 200, "Participant removed correctly.");
  } catch (err) {
    return sendResponse(res, status, err.message);
  }
};

exports.deleteRoleplay = async (req, res) => {
  let status = 500;
  const id = req.body.id;
  if (!id) {
    status = 400;
    throw new Error("Need a roleplay id");
  }
  try {
    const result = await Roleplay.destroy({ where: { id } });
    console.log("RESULT ", result);
    if (result === 0) {
      status = 400;
      throw new Error("There is no roleplay with this id.");
    }
    return sendResponse(res, 200, "Roleplay removed correctly.");
  } catch (err) {
    return sendResponse(res, status, err.message);
  }
};

exports.getAllRoleplays = async (req, res) => {
  let status = 500;
  let userId = req.user && !req.user.expired ? req.user.id : null;
  let expired = req.user && req.user.expired ? true : false;
  try {
    //(ordenados del más reciente al menos,
    //con el número de participantes actuales y el número de peticiones,
    //el nombre del creador y un campo indicando si participa en el rol o no)
    //return sendResponse(res, 200, "Roleplay removed correctly.");
    const data = await Roleplay.findAll({
      // attributes: {
      //   include: [
      //     [
      //       Sequelize.fn("COUNT", Sequelize.col("users.id")),
      //       "numCurrentParticipants",
      //     ],
      //   ],
      // },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["id"],
          through: {
            attributes: [],
          },
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
        {
          model: Tag,
          attributes: ["name"],
          through: {
            attributes: [],
          },
        },
      ],
      //group: ["Roleplay.id", "users.id"],
    });

    if (data.length === 0) {
      return sendResponse(
        res,
        status,
        "Any roleplay has been found",
        roleplays
      );
    } else {
      console.log("DATA", data);
      const roleplays = data.map((r) => {
        let isParticipating = false;
        let tags = [];

        if (userId) {
          r.users.forEach((u) => {
            if (u.id === userId) isParticipating = true;
          });
        }
        if (r.tags) tags = r.tags.map((t) => t.name);

        return {
          id: r.id,
          name: r.name,
          description: r.description,
          creator: r.creator.name,
          numParticipants: r.numParticipants,
          numCurrentParticipants: r.users.length,
          tags,
          isParticipating,
          background: r.background,
          timestamp: r.createdAt,
        };
      });

      return sendResponse(res, 200, "Got roleplays", {
        userExpired: expired,
        roleplays,
      });
    }
  } catch (err) {
    return sendResponse(res, status, err.message);
  }
};

const userExists = async (userId) => {
  const user = await User.findOne({ where: { id: userId } });
  if (user) return;
  throw new Error(`User with id=${userId} does not exist`);
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
