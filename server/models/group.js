const { model, Schema } = require('mongoose');

const groupSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    isOne2One: { //是否为单聊，1：单聊 ，0：群聊
        type: Number,
        default: 1,
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    createTime: {
        type: Number,
        default: Math.round(new Date() / 1000),
        set: (val) => Math.round(new Date() / 1000)
    }
});
module.exports = model('Group', groupSchema);