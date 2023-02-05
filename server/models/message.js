const { Schema, model } = require('mongoose');
//存储聊天记录
const messageSchema = new Schema({
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
    },
    // chat: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Chat',
    // },

    sender: { //发送者id
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: { //接收者id
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: { //消息内容
        type: String,
    },
    traslatedContent: { //翻译消息内容
        type: String,
    },
    content_type: { //消息内容的类型，text,image
        type: String,
        default: 'text'
    },
    isRead: { //是否已读
        type: Boolean,
        default: false
    },
    updateAt: {
        type: Number,
        default: Math.round(new Date() / 1000),
        set: (val) => Math.round(new Date() / 1000)
    }
})

module.exports = model("Message", messageSchema);