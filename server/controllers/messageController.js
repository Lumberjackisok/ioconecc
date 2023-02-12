const Message = require('../models/message');
const Group = require('../models/group');
const { openAITranslate } = require('../utils/translateApis');
const { verifyToken } = require('../utils/token');
const { JWT_SECRET } = require('../config/index');


//ignore
module.exports.sendMessage = async (req, res, next) => {
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
module.exports.mssageHistory = async (req, res, next) => {
    const { receiver } = req.query;
    const { payload } = req;
    if (payload.uid) {
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
    }

    next();
};

//创建group，即聊天室,分群聊聊天室和单聊聊天室，先检测数据库有没有该聊天室
module.exports.createGroup = async (req, res, next) => {
    const { name, isOne2One } = req.body;
    const { payload } = req;

    /**
     * 创建group前先检查有无group
     */
    try {
        //检查是否有该聊天室
        const group = await Group.findOne({ name: name });
        if (payload.uid && group == null) {
            if (isOne2One == 1) {
                const group1 = new Group({
                    name: name,
                    isOne2One: 1,
                    createTime: new Date()
                });
                try {
                    await group1.save();
                    res.json({
                        status: 200,
                        message: 'one2one Successful|单聊创建成功',
                    })
                } catch (err) {
                    console.log(err);
                }
            } else {
                const group2 = new Group({
                    name: name,
                    isOne2One: 0,
                    createTime: new Date()
                });
                try {
                    await group2.save();
                    res.json({
                        status: 200,
                        message: 'Group Successful|群聊创建成功',
                    })
                } catch (err) {
                    console.log(err);
                }
            }
        }
        res.json({
            message: "room已存在|Existed",
        })


    } catch (err) {
        console.log(err);
    }
};

//获取消息预览列表
module.exports.notifyList = async (req, res, next) => {

    const { payload } = req;

    if (payload.uid) {
        try {
            const list = await Message.find({
                $or: [
                    { sender: payload.uid },
                    { receiver: payload.uid }
                ]
            })
                .select("content sender receiver updateAt isRead traslatedContent")
                .sort({ updateAt: -1 });

            res.json({
                status: 200,
                datas: list
            })
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: '获取消息预览列表失败' });
        }

    }


};