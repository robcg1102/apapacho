require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const cors = require('cors')

const app = express();

mongoose
  .connect(process.env.URI_DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
  })
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

const passport = require("./config/passport");

app.set("views", __dirname + "/views");
app.set("view engine", "hbs");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

app.use(cors())

app.use(
  session({
    secret: "our-passport-local-strategy-app",

    resave: false,

    saveUninitialized: true,

    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(flash());

app.use(passport.initialize());

app.use(passport.session());

const authRouter = require("./routes/auth-routes");

app.use("/", authRouter);

module.exports = app;
