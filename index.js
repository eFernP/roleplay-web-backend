const bodyParser = require("body-parser");

require("dotenv").config();

const { db } = require("./models");
const usersRoute = require("./routes/user.route");
const express = require("express");

const app = express();

// //use config module to get the privatekey, if no private key set, end the application
// if (!config.get("privateKey")) {
//   console.error("FATAL ERROR: privateKey is not defined.");
//   process.exit(1);
// }

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

db.sequelize.sync();

//use users route for api/users
app.use("/api/users", usersRoute);

const port = process.env.PORT;
app.listen(port, () => console.log(`Listening on port ${port}...`));
