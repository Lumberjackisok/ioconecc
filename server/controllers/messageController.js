const Message = require('../models/message');
const Group = require('../models/group');
const { openAITranslate } = require('../utils/translateApis');
const { verifyToken } = require('../utils/token');
const { JWT_SECRET } = require('../config/index');
const User = require('../models/user');

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
    try {
        const { payload } = req;
        if (payload.uid) {
            const messages = await Message.find({
                $or: [{
                        sender: payload.uid,
                        receiver: receiver
                    },
                    {
                        sender: receiver,
                        receiver: payload.uid
                    }
                ]
            });

            const datas = {
                message: messages,
            };

            console.log('get history controller [receiver:', receiver);
            res.json({
                status: 200,
                datas: datas
            });
        }
    } catch (err) {
        console.log(err);
    }
};



//创建group，即聊天室,分群聊聊天室和单聊聊天室，先检测数据库有没有该聊天室
module.exports.createGroup = async(req, res, next) => {
    /**
     * 创建group前先检查有无group
     */
    try {
        const { payload } = req;
        const { name, isOne2One } = req.body;

        const tempName = name.split(" ");
        const name2 = tempName[1] + " " + tempName[0];
        /**
         * 由于单聊聊天室命名规则为id相加，所以聊天室名有两种情况，
         * 1.用户一点击用户二，则为传进来的name，则检查
         * 2.用户二点击用户一，除了点击自传进来的name外，还需要检查uid1+" "uid2的name
         * 
         * 
         */
        //检查是否有该聊天室
        const groupCheck1 = await Group.findOne({ name: name });
        const groupCheck2 = await Group.findOne({ name: name2 });

        const membersIds = name.split(" ");

        const finalChecke = (groupCheck1 == null && groupCheck2 == null) ? true : false;

        if (payload.uid && finalChecke) {
            if (isOne2One == 1) {
                const group1 = new Group({
                    name: name,
                    members: membersIds,
                    isOne2One: 1,
                    createTime: new Date()
                });

                await group1.save();

                res.json({
                    status: 200,
                    group: group1,
                    message: 'one2one Successful|单聊创建成功',
                });

            } else {
                const group2 = new Group({
                    name: name,
                    members: membersIds, //群聊待定
                    isOne2One: 0,
                    createTime: new Date()
                });

                await group2.save();
                res.json({
                    status: 200,
                    group: group2,
                    message: 'Group Successful|群聊创建成功',
                });
            }

        } else {
            res.json({
                status: 200,
                message: "room已存在|Existed",
                group: groupCheck1 == null ? groupCheck2 : groupCheck1
            });
        }

    } catch (err) {
        console.log(err);
    }

};

//获取消息预览列表
module.exports.notifyList = async(req, res, next) => {

    const { payload } = req;
    if (payload.uid) {
        try {
            /**
             *  找到group列表，
             * 通过group列表：1.利用每个group的members找到每个group里的非自己的那个用户
             *               2.找到每个group关联的message的最新一条mesaage作为消息预览
             */

            const group = await Group.find({
                name: { $regex: payload.uid, $options: 'i' },
                isOne2One: 1
            });

            //用来装所有取得过联系的好友的id
            let frendsId = [];

            //拿到所有取得过联系的好友的id
            group.forEach((item) => {
                //单聊逻辑，群聊待定
                if (item.members.length == 2) {
                    item.members.forEach((member) => {
                        if (member != payload.uid) {
                            frendsId.push(member);
                        }
                    });
                }
                //单聊逻辑，群聊待定
            });

            //查找用户信息
            let frendsData = [];
            for (let i = 0; i < frendsId.length; i++) {
                const user = await User.findOne({ _id: frendsId[i] }).select({
                    password: 0,
                });

                //toObject()方法将对象转换为json对象便于为从mongoDB里取的数据添加键值对
                frendsData.push(user.toObject() == undefined ? {} : user.toObject());
            }


            /**
             * 查找每个groupid关联的所有消息中最近的消息， 
             * 以及通过frendsData里的id和message里的sender或receiver将最新的那条消息与聊天室绑定在一起
             * */
            let notifys = [];
            for (let i = 0; i < group.length; i++) {
                let notify = await Message.find({ group: { $in: group[i]._id } })
                    .select("content sender receiver updateAt isRead translatedContent group")
                    .sort({ updateAt: -1 }); //-1：降序，1：升序

                notifys.push(notify[0] == undefined ? {} : notify[0].toObject());
            }

            //用循环将最新message和frendsData以一一对应的形式捆捆绑
            for (let i = 0; i < notifys.length; i++) {

                /**
                 * frendsData和notifys都是以group为出发点过滤出来的 
                 * 
                 */
                frendsData[i]["notify"] = notifys[i];
            }

            res.json({
                status: 200,
                frends: frendsData,
                notifys: notifys,
            })
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: '获取消息预览列表失败' });
        }

    }
};

//当客户端滚动至底部后更新状态为已读
module.exports.updateMessageStatus = async(req, res, next) => {
    const { receiver } = req.body;

    try {
        const { uid } = req.payload;
        if (uid) {
            //更新状态为已读
            await Message.updateMany({
                $or: [{
                        sender: uid,
                        receiver: receiver
                    },
                    {
                        sender: receiver,
                        receiver: uid
                    }
                ]
            }, {
                $set: { isRead: 1 }
            });

            res.json({
                status: 200,
                message: 'Successfully update message status|更新状态为已读成功'
            });

        } else {
            res.json({
                status: 401,
                message: 'No user found|没有找到用户'
            });
        }

    } catch (err) {
        console.log(err);
        res.json({
            message: err
        });
    }

}

//更新指定数组的id的message的isRead状态
module.exports.updateMessageByIds = async(req, res, next) => {
    const { ids } = req.body;

    try {
        const { uid } = req.payload;
        if (uid) {
            await Message.updateMany({ _id: { $in: ids } }, { $set: { isRead: 1 } });

            console.log('更新成功');
            res.json({
                status: 200,
                message: 'Successfully update message status|更新状态为已读成功'
            });

        } else {
            res.json({
                status: 401,
                message: 'No user found|没有找到用户'
            });
        }

    } catch (err) {
        console.log(err);
        res.json({
            message: err
        });
    }
}

//翻译文本
module.exports.tanslate = async(req, res, next) => {

}