const { model, Schema } = require('mongoose');

const groupSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        min: 3,
        max: 20
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