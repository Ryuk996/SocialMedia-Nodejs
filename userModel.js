const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    firstName: { 
        type: String,
        required: [true, "Please enter your name!"],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, "Please enter your name!"],
        trim: true
    },
    userName: {
        type: String,
        required: [true, "Please enter your email!"],
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: [true, "Please enter your password!"]
    },
    profilePic: {
        type: String,
        default: "https://res.cloudinary.com/devatchannel/image/upload/v1602752402/avatar/avatar_cugq40.png"
    },
    status: {
        type: String,
        default: "Hello There"
    }
     
}, {
    timestamps: true
})

// const Users = mongoose.model("Users", userSchema, 'accounts');
// module.exports = Users

module.exports = mongoose.model("Users", userSchema, 'accounts');