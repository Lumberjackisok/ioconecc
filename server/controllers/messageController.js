const Message = require('../models/message');

module.exports.sendMessage = async(req, res, next) => {
    const { sender, receiver, conten_type, content } = req.body;
};