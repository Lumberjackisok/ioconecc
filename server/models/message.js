const { Schema, model } = require('mongoose');
//存储聊天记录
const messageSchema = new Schema({
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
    },
    chat: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    updateAt: {
        type: Number,
        default: Math.round(new Date() / 1000),
        // set: (val) => { Math.round(new Date() / 1000) }
    }
})

module.exports = model("Message", messageSchema);