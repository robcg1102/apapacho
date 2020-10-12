const { model, Schema } = require("mongoose");

const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema(
  {
    email: String,

    name: String,
    creator: {
      type: Boolean,
      default: false,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    valReg: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const User = model("User", userSchema);

module.exports = User;
