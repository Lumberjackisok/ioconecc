const { Schema, model } = require('mongoose');
//存储聊天记录
const messageSchema = new Schema({
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
    contentType: { //消息内容的类型，1=text,2=image
        type: Number,
        default: 1
    },
    content: { //消息内容
        type: String,
    },
    traslatedContent: { //翻译消息内容
        type: String,
    },
    group: { //群组
        type: Schema.Types.ObjectId,
        ref: 'Group',
    },
    isRead: { //是否已读
        type: Number,
        default: 0
    },
    updateAt: {
        type: Number,
        default: Math.round(new Date() / 1000),
        set: (val) => Math.round(new Date() / 1000)
    }

})

module.exports = model("Message", messageSchema);