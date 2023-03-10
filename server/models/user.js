const mongoose = require('mongoose');

//加密
const bcryptjs = require('bcryptjs');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        min: 3,
        max: 20
    },
    email: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 20,
        set: (val) => bcryptjs.hashSync(val, 10)
    },
    avatar: {
        type: String,
        default: ""
    },
    language: {
        type: String,
        default: "chinese"
    },
    createTime: {
        type: Number,
        default: Math.round(new Date() / 1000),
        set: (val) => Math.round(new Date() / 1000)
    },
    isOnline: {
        type: Number,
        default: 0
    },
    socketId: {
        type: String,
        default: ''
    },
    lastLogin: {
        type: String,
        default: "Privacy"
    }
})

module.exports = mongoose.model('User', userSchema);