const mongoose = require("mongoose")

function connectDB(url) {
  mongoose.connect(url)
}

module.exports = connectDB;
