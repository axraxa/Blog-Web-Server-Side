const passport = require("passport");
const User = require("../models/User");
const jwt = require("jsonwebtoken")
const GoogleStrategy = require("passport-google-oauth20").Strategy
require("dotenv").config();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/v1/user/auth/google/callback",
  }, async (accessToken, refreshToken, profile, done) => {
    const user = await User.findOne({ mail: profile.emails[0].value })
    if (!user) {
      const newUser = new User({
        mail: profile.emails[0].value,
        isOauthUser: true,
        path: profile.photos[0].value,
        name: profile.name.givenName
      });
      await newUser.save()
      jwt.sign({ newUser }, process.env.TOKEN_KEY, { algorithm: "HS256" }, function(err, token) {
        if (err) return res.json({ err })
        return done(null, { successRedirect: `http://localhost:5173/tokenverify/${token.replace(/\./g, "jemaliBidzia")}` });
      })
    }
    if (user.isOauthUser) {
      jwt.sign({ user }, process.env.TOKEN_KEY, { algorithm: "HS256" }, function(err, token) {
        if (err) return res.json({ err })
        return done(null, { successRedirect: `http://localhost:5173/tokenverify/${token.replace(/\./g, "jemaliBidzia")}` });
      })
    } else {
      return done(null, { failureRedirect: `http://localhost:5173/Mail is already in use` });
    }
  }
))
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});


module.exports = passport;
