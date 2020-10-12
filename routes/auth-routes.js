const express = require("express");
const router = express.Router();
const passport = require("passport");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const Comment = require("../models/Comments");

router.get("/", (req, res) => {
  res.render("home", { user: req.user, title: "Inicio" });
});

router.get("/signup", ensureAuth, (req, res, next) => {
  res.render("auth/signup", { title: "Regístrate" });
});

router.post("/signup", validateEmail, (req, res, next) => {
  const { name, email, password } = req.body;
  if (email === "" || password === "") {
    return res.render("auth/signup", {
      message: "Debes llenar todos los campos",
    });
  }

  User.findOne({ email }).then((user) => {
    if (user !== null) {
      return res.render("auth/signup", {
        message: "Ya hay una cuenta asociada a ese correo.",
      });
    }

    let transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    User.register({ email, name }, password).then((userCreated) => {
      transporter.sendMail({
        from: '"Apapacho" <ejemplo@correo.com>',

        to: email,

        subject: "Validar correo",

        text: "Lo que sea",

        html: `<div style="text-align:center";>
        <h1>Apapacho</h1>
        <h3>Confirma tu nueva cuenta del sitio Apapacho desde el siguiente enlace: </h3>
        <a href=${`https://apapacho.herokuapp.com/validate/${userCreated._id}`} target="_blank">Valida tu correo aquí</a>
                
        <hr>
        <p>¡Gracias!</p>
        </div>
        `,
      });
      res.render("auth/login", { message: "Antes de ingresar, valida tu cuenta en tu correo electrónico.", title: "Ingresa" });
    });
  });
});
// ${`http://localhost:3000/validate/${userCreated._id}`}

router.get("/login", ensureAuth, (req, res, next) => {
  res.render("auth/login", { message: req.flash("error"), title: "Ingresa" });
});

router.post(
  "/login",
  ensureEmail,
  passport.authenticate("local", {
    successRedirect: "/private-page",

    failureRedirect: "/login",

    failureFlash: true,
  })
);

router.get("/validate/:id", (req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      if (user.valReg === false) {
        User.findByIdAndUpdate(user.id, { valReg: true })
          .then(() => {
            res.render("validation", {
              message: "Tu cuenta ha sido verificada",
              title: "Validación",
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        return res.render("validation", {
          message:
            "Tu cuenta ya había sido verificada, ya no es necesario que realices este proceso",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

function ensureEmail(req, res, next) {
  User.findOne({ email: req.body.email }).then((user) => {
    if (user === null) {
      return res.render("auth/login", {
        message: "No hay cuenta registrada con ese correo",
      });
    }
    if (user.valReg === false) {
      return res.render("auth/login", {
        message: "Valida tu cuenta en tu correo",
      });
    } else {
      return next();
    }
  });
}

function ensureLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/private-page");
  } else {
    return next();
  }
}

function ensureCreator(req, res, next) {
  if (req.user.creator) {
    return next();
  } else {
    return res.redirect("/private-page");
  }
}

function validateEmail(req, res, next) {
  var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  if (regex.test(req.body.email)) {
    return next();
  } else {
    return res.render("auth/signup", {
      message: "Debes ingresar un email válido",
    });
  }
}

router.get("/private-page", ensureLogin, (req, res, next) => {
  Comment.find()
    .populate("donor")
    .populate("owner")
    .then((allComments) => {
      const elemFilter = allComments
        .filter((data) => {
          return data.active === false;
        })
        .filter((data) => {
          return JSON.stringify(data.donor) === JSON.stringify(req.user);
        });
      res.render("private", {
        comments: elemFilter,
        user: req.user,
        title: "Perfil",
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/private-page", ensureLogin, (req, res, next) => {
  const { comment, who, description } = req.body;

  const { _id } = req.user;

  Comment.create({ comment, who, description, owner: _id })
    .then(() => {
      res.redirect("/mycomments");
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/mycomments", ensureLogin, ensureCreator, (req, res, next) => {
  const { _id } = req.user;

  Comment.find({ owner: _id })
    .populate("owner")
    .populate("donor")
    .then((userComments) => {
      res.render("userComments", {
        comments: userComments,
        user: req.user,
        title: "Mis solicitudes",
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/mycomments/:id", ensureLogin, (req, res, next) => {
  const id = req.params.id;
  Comment.findByIdAndDelete(id)
    .then(() => {
      res.redirect("/mycomments");
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/allComments", ensureLogin, (req, res, next) => {
  Comment.find()
    .populate("donor")
    .populate("owner")
    .then((allComments) => {
      const activeComments = allComments.filter((comment) => {
        return comment.active === true;
      });
      res.render("allComments", {
        comments: activeComments,
        user: req.user,
        title: "Solicitudes",
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/donate/:id", ensureLogin, (req, res, next) => {
  const id = req.params.id;
  const { _id } = req.user;

  Comment.findById(id).then((comment) => {
    let active = comment.active;

    if (active) {
      Comment.findByIdAndUpdate(id, { active: false, donor: _id }).then(
        (data) => {
          res.redirect("/private-page");
        }
      );
    } else {
      Comment.findByIdAndUpdate(id, { active: true, donor: null }).then(
        (data) => {
          res.redirect("/allComments");
        }
      );
    }
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

router.use((req, res) => {
  res.render("notfound");
});

module.exports = router;
