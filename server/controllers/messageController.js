const Message = require('../models/message');
const { openAITranslate } = require('../utils/translateApis');
const { verifyToken } = require('../utils/token');
const { JWT_SECRET } = require('../config/index');


//ignore
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

//获取用户与用户之间的聊天记录
module.exports.mssageHistory = async(req, res, next) => {
    const { receiver } = req.query;
    const token = req.headers['authorization'].replace('Bearer ', '');

    //验证token,拿到用户id和language
    const payload = await verifyToken(token, JWT_SECRET);

    const messages = await Message.find({
        $or: [{
            sender: payload.uid,
            receiver: receiver
        }, {
            sender: receiver,
            receiver: payload.uid
        }]
    });

    const datas = {
        message: messages,
    };
    console.log('receiver:', receiver);
    res.json({
        status: 200,
        datas: datas
    });
};

//获取消息列表
module.exports.notifyList = async(req, res, next) => {
    const { sender } = req.body
};