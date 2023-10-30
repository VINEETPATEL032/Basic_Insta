const mongoose = require("mongoose");
const { stringify } = require("nodemon/lib/utils");
const passportLocalMongoose = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/instaFeature");

const userSchema = mongoose.Schema({
  name: String,
  username: String,
  age: Number,
  email: String,
  image: {
    type: String,
    default: "def.png"
  },
  password: String,
  posts:[{type: mongoose.Schema.Types.ObjectId, ref: "post"}],
  key: String,
  expirykey: Date
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose. model("user", userSchema);
