// multipart/form-data
const multer = require("multer");
// storage options
const storage = multer.diskStorage({
  //declaring destination
  destination: function(req, file, cb) {
    cb(null, './uploads')
  },
  //declaring way to name the files
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  },
})
const avatarStorage = multer.diskStorage({
  //declaring destination
  destination: function(req, file, cb) {
    cb(null, './avatars')
  },
  //declaring way to name the files
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  },
})
// defining file types , function
const allowedTypes = ["image/png", "image/jpeg", "image/gif"]
function fileFilter(req, file, cb) {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("You can only upload pngs , jpgs and gifs."), false);
  }
}
//passing options to upload.
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  //declaring limits of files, for example size.
  limits: {
    fileSize: 1024 * 1024 //this is 1mb
  }
})
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  //declaring limits of files, for example size.
  limits: {
    fileSize: 1024 * 1024 //this is 1mb
  }
})
module.exports = { multer, upload, uploadAvatar };
