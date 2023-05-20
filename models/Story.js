const mongoose = require("mongoose")
const { Schema } = mongoose;
const User = require("./User")
const fs = require("fs");
const path = require("path");

const storySchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User" },
  name: { type: String, maxlength: 100, required: true },
  story: { type: String, required: true },
  path: { type: String },
  createdAt: { type: Date, default: Date.now() },
  comments: [
    {
      author: { type: Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, maxlength: 300, required: true },
    },
  ],
})

storySchema.pre("findOneAndDelete", async function(next) {
  const story = this;
  const currentStory = await story.model.findOne({ _id: story._conditions._id }).select("path");
  try {
    const currentPath = path.join(__dirname, `../${currentStory.path}`)
    //deleting image.
    fs.rm(currentPath, {}, function(err) {
      if (err) console.error(err)
    })
    // removing reference in users or user
    await User.updateMany({ stories: story._conditions._id },
      { $pull: { stories: story._conditions._id } })
    next();
  } catch (err) {
    next(err);
  }
})
module.exports = mongoose.model("Story", storySchema);
