const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path")
const { multer, uploadAvatar } = require("../controllers/multer")

router.post("/login", async (req, res) => {
  try {
    const { mail, password } = req.body;
    const user = await User.findOne({ mail: mail })
    if (!user) return res.json({ msg: "Email is not registered." })
    bcrypt.compare(password, user.password, function(err, result) {
      if (err) return res.send(err)
      if (result) {
        jwt.sign({ user }, process.env.TOKEN_KEY, { algorithm: "HS256" }, function(err, token) {
          if (err) return res.json({ err })
          return res.json({ user, token })
        })
      } else {
        return res.json({ msg: "Wrong Password" })
      }
    })
  } catch (err) {
    if (err.ValidationError) return res.send(err);
    return res.json({ msg: err })
  }
})

router.post("/register", async (req, res) => {
  try {
    const { mail, password, username } = req.body;
    const user = new User({
      name: username,
      mail: mail,
      password: password
    })
    await user.save();
    res.send("User Created")
  } catch (err) {
    if (err.ValidationError) return res.send("Validation error")
    res.json({ msg: err })
  }
})

router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) res.json({ msg: "Provide token!" })
    jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
      if (err) return res.json({ msg: err })
      const user = await User.findById(decoded.user._id);
      if (user) return res.json(user);
      return res.json({ msg: "User's account is deleted." })
    })
  } catch (err) {
    res.json({ msg: err })
  }
})

router.patch("/updateName", async (req, res) => {
  try {
    const { name } = req.body;
    const token = req.headers.authorization;
    jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
      if (err) return res.json({ err });
      const user = await User.findByIdAndUpdate(decoded.user._id, { name: name }, { new: true })
      jwt.sign({ user }, process.env.TOKEN_KEY, { algorithm: "HS256" }, function(err, newToken) {
        if (err) return res.json({ err })
        return res.json({ user, newToken });
      })
    })
  } catch (err) {
    res.json({ msg: err })
  }
});
router.patch("/updateMail", async (req, res) => {
  try {
    const { mail } = req.body;
    const token = req.headers.authorization;
    const checkingUser = await User.findOne({ mail: mail });
    if (checkingUser) return res.json({ msg: "This mail is already in use" })
    jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
      if (err) return res.json({ err });
      const user = await User.findByIdAndUpdate(decoded.user._id, { mail: mail }, { new: true })
      jwt.sign({ user }, process.env.TOKEN_KEY, { algorithm: "HS256" }, function(err, newToken) {
        if (err) return res.json({ err })
        return res.json({ user, newToken });
      })
    })
  } catch (err) {
    res.json({ msg: err });
  }
});
router.patch("/updatePassword", async (req, res) => {
  const { password, newPassword } = req.body;
  const token = req.headers.authorization;
  jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
    if (err) return res.json({ err });
    const user = await User.findById(decoded.user._id);
    bcrypt.compare(password, user.password, function(err, result) {
      if (err) return res.json({ err });
      if (result) {
        user.password = newPassword;
        user.save();
        jwt.sign({ user }, process.env.TOKEN_KEY, { algorithm: "HS256" }, function(err, newToken) {
          if (err) return res.json({ err })
          return res.json({ newToken, user });
        })
      } else {
        return res.json({ msg: "password is incorrect." })
      }
    })
  })
});

router.patch("/updateProfilePicture", async (req, res) => {
  try {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.TOKEN_KEY, function(err, decoded) {
      if (err) return res.json({ msg: err })
      uploadAvatar.any()(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ msg: err.message });
        } else if (err) {
          return res.status(400).json({ msg: err.message });
        }
        if (!req.files) {
          return res.status(404).json({ msg: "You need to upload file first." })
        }
        const user = await User.findById(decoded.user._id);
        if (user.path != "avatars/default.png") {
          fs.rm(path.join(__dirname, `../${user.path}`), function(err) {
            console.log(err)
          })
        }
        user.path = req.files[0].path;
        user.save();
        jwt.sign({ user }, process.env.TOKEN_KEY, function(err, newToken) {
          if (err) return res.json({ msg: err });
          return res.json({ newToken, user })
        })
      })
    })
  } catch (err) {
    res.json({ msg: err })
  }
})

module.exports = router;
