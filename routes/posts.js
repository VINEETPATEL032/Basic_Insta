const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    userid: {type: mongoose.Schema.Types.ObjectId, ref: "user"},
    data: String,
    time: {
        type: Date,
        default: Date.now()
    },
    likes: [
        {type: mongoose.Schema.Types.ObjectId, ref: "user"}
    ],
})

module.exports = mongoose.model("post", postSchema)