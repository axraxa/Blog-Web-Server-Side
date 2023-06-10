const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs")
const { Schema } = mongoose;
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 20
  },
  mail: {
    type: String,
    validate: [validator.isEmail, "Invalid email"],
    required: true,
    unique: true,
  }, password: {
    type: String,
    required: function() {
      return !this.isOauthUser
    },
  },
  stories: [{ type: Schema.Types.ObjectId, ref: "Story" }],
  likedStories: [{ type: Schema.Types.ObjectId, ref: "Story" }],
  path: { type: String, default: "avatars/default.png" },
  isOauthUser: { type: Boolean, default: false }
})
//encrypting password.
userSchema.pre("save", function(next) {
  let user = this;
  if (!user.isModified("password")) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err)
      user.password = hash;
      next();
    })
  })
})
module.exports = mongoose.model("User", userSchema)
