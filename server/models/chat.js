//单独聊天模块
const { Schema, model } = require('mongoose');
const chatSchema = new Schema({
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
});
module.exports = model('Chat', chatSchema);