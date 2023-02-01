const { Schema, model } = require('mongoose');
const NotificationSchema = new Schema({
    type: { //类型，已读，未读
        type: String,
        required: true
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
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group'
    },
    content: {
        type: String,
        required: true
    },
    createAt: {
        type: Number,
        default: Math.round(new Date() / 1000),
        set: (val) => { Math.round(new Date() / 1000) }
    }
});
module.exports = model('Notification', NotificationSchema);