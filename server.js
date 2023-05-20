const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs")
const connectDB = require("./connections/db");
const User = require("./routes/User")
const Story = require("./routes/Story")
require("dotenv").config();


app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())


// routes
app.use("/api/v1/user", User)
app.use("/api/v1/story", Story);

// images
app.use("/uploads", express.static("uploads"))
app.use("/avatars", express.static("avatars"))


// server 
const PORT = process.env.PORT || 8000
const startServer = async () => {
  try {
    connectDB(process.env.DB_LINK);
    console.clear();
    console.log("listening on" + PORT)
    app.listen(PORT)
  } catch (err) {
    console.log(err)
  }
};

startServer();
