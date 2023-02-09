const Message = require('../models/message');
const { openAITranslate } = require('../utils/translateApis');
const { verifyToken } = require('../utils/token');
const { JWT_SECRET } = require('../config/index');

module.exports.sendMessage = async(req, res, next) => {
    const { sender, receiver, contentType, content } = req.body;

    const token = req.headers['authorization'].replace('Bearer ', '');

    //验证token,拿到用户id和language
    const payload = await verifyToken(token, JWT_SECRET);

    let translateText = await openAITranslate(content, payload.language);

    console.log('translateText', translateText);

    res.json({
        status: 200,
        message: '消息发送成功',
        data: {
            sender: sender,
            receiver: receiver,
            content: content,
            translateText: translateText,
        }
    });
};