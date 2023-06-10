const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const User = require("../models/User");
const Story = require("../models/Story");
const jwt = require("jsonwebtoken");
const { upload, multer } = require("../controllers/multer");


//Get Requests
router.get("/posts", async (req, res) => {
  try {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
      if (err) return res.json({ msg: err });
      const stories = await Story.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("author")
      const length = await Story.find();
      if (stories)
        return res.json({
          stories,
          length: length.length,
          itemsLength: stories.length,
        });
      return res.json({ msg: "There is no story." });
    });
  } catch (err) {
    return res.json({ msg: err });
  }
});
router.get("/posts/:page", async (req, res) => {
  try {
    const { page } = req.params;
    const token = req.headers.authorization;
    jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
      if (err) return res.json({ msg: err });
      const stories = await Story.find()
        .sort({ createdAt: -1 })
        .skip(10 * page)
        .limit(10)
        .populate("author");
      if (stories) return res.json({ stories });
      return res.json({ msg: "There is no story." });
    });
  } catch (err) {
    return res.json({ msg: err });
  }
});
router.get("/postsSearch/:search&:quantity", (req, res) => {
  const token = req.headers.authorization;
  const { search, quantity } = req.params;
  jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
    if (err) return res.json({ msg: err })
    const posts = await Story.find({ name: { $regex: search } }).populate("author")
      .skip(10 * quantity).limit(10);
    if (posts) return res.json({ stories: posts })
    return res.json({ msg: "There is no posts like this" })

  })
})
router.get("/post/:id", (req, res) => {
  const token = req.headers.authorization;
  jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
    if (err) return res.json({ msg: err })
    const { id } = req.params;
    const post = await Story.findById(id).populate("author").populate("comments.author");
    return res.json({ post });
  })
});

router.get("/UsersPosts/:id&:quantity", (req, res) => {
  const { id, quantity } = req.params;
  const token = req.headers.authorization;
  jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
    if (err) return res.json({ msg: err })
    const user = await User.findById(id).populate("stories").sort({ "stories.createdAt": - 1 }).skip(10 * quantity).limit(10);
    if (!user) return res.json({ msg: "There is no user like that" })
    return res.json({ user })
  })
})



//Post requests
router.post("/create", async (req, res) => {
  try {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.TOKEN_KEY, function(err, decoded) {
      if (err) return res.json({ msg: err });
      upload.any()(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ msg: err.message });
        } else if (err) {
          return res.status(400).json({ msg: err.message });
        }
        if (!req.files) {
          return res
            .status(404)
            .json({ msg: "You need to upload file first." });
        }
        const { name, story } = req.body;
        const newStory = new Story({
          name: name,
          story: story,
          author: decoded.user._id,
          path: req.files[0].path,
        });
        newStory.save();
        const user = await User.findById(decoded.user._id);
        user.stories.push(newStory);
        user.save();
        return res
          .status(200)

          .json({ success: "Your file successfuly uploaded" });
      });
    });
  } catch (err) {
    return res.send(err);
  }
});

//Patch Requests
router.patch("/titleUpdate", (req, res) => {
  const { name, id } = req.body;
  jwt.verify(
    req.headers.authorization,
    process.env.TOKEN_KEY,
    async function(err, decoded) {
      if (err) return res.json({ msg: err });
      const post = await Story.findOne({ _id: id });
      if (decoded.user._id == post.author) {
        post.name = name;
        post.save();
        return res.json({ msg: "Post updated successfully." });
      }
      return res.json({
        msg: "You Don't have permission to change this post.",
      });
    }
  );
});
router.patch("/storyUpdate", (req, res) => {
  const { story, id } = req.body;
  jwt.verify(
    req.headers.authorization,
    process.env.TOKEN_KEY,
    async function(err, decoded) {
      if (err) return res.json({ msg: err });
      const post = await Story.findOne({ _id: id });
      if (decoded.user._id == post.author) {
        post.story = story;
        post.save();
        return res.json({ msg: "Post updated successfully." });
      }
      return res.json({
        msg: "You Don't have permission to change this post.",
      });
    }
  );
});
router.patch("/imageUpdate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    jwt.verify(
      req.headers.authorization,
      process.env.TOKEN_KEY,
      async function(err, decoded) {
        if (err) return res.json({ msg: err });
        const story = await Story.findById(id);
        if (story.author == decoded.user._id) {
          upload.any()(req, res, async function(err) {
            if (err instanceof multer.MulterError) {
              return res.status(400).json({ msg: err.message });
            } else if (err) {
              return res.status(400).json({ msg: err.message });
            }
            if (!req.files) {
              return res
                .status(404)
                .json({ msg: "You need to upload file first." });
            }
            fs.rm(path.join(__dirname, `../${story.path}`), function(err) {
              console.log(err);
            });
            story.path = req.files[0].path;
            story.save();
            return res.json({ msg: "Post Image Changed Successfully" });
          });
        } else {
          return res
            .status(300)
            .json({ msg: "You Don't have permission to change this post." });
        }
      }
    );
  } catch (err) {
    return res.json({ msg: err });
  }
});

router.patch("/commentOnPost/:id", (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization;
  const { comment } = req.body;
  jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
    if (err) {
      return res.json({ msg: err })
    }
    const post = await Story.findById(id).populate("author").populate("comments.author");
    if (post) {
      post.comments = [...post.comments, { author: decoded.user._id, text: comment }]
      post.save();
      return res.json({ msg: "You commented successfully", success: true, post })
    } else {
      return res.json({ msg: "There is no post like that " })
    }
  })
});
//Delete Requests
router.delete("/deleteComment/:postId&:id", (req, res) => {
  const { id, postId } = req.params;
  const token = req.headers.authorization;
  jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
    if (err) return res.json({ msg: err })
    const post = await Story.findById(postId).populate("author").populate("comments.author");
    const comment = post.comments.filter(each => each._id == id);
    if (comment[0].author._id == decoded.user._id || post.author._id == decoded.user._id) {
      const updatedComments = post.comments.filter(each => each._id != id)
      post.comments = updatedComments;
      post.save();
      return res.json({ post })
    }
    return res.json({ msg: "You have not permission to delete this comment." })
  })
})
router.delete("/delete/:id", (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;
    jwt.verify(token, process.env.TOKEN_KEY, async function(err, decoded) {
      if (err) return res.json({ msg: err });
      const post = await Story.findById(id).populate("author");
      if (decoded.user._id == post.author._id) {
        await Story.findByIdAndDelete(id);
      }
      return res.json();
    });
  } catch (err) {
    return res.json({ msg: err });
  }
});
module.exports = router;
