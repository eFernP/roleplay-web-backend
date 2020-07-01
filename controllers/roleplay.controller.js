const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { db } = require("../models");
const Roleplay = db.models.roleplay;
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
