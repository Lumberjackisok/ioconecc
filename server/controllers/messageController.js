const Message = require('../models/message');
const Group = require('../models/group');
const User = require('../models/user');



//获取用户与用户之间的聊天记录
module.exports.mssageHistory = async(req, res, next) => {
    const { receiver } = req.query;
    try {
        const { payload } = req;
        if (payload.uid) {
            //通过传进来的receiver查询是否为群组
            const userPromise = User.findOne({ _id: receiver }).select({
                password: 0,
            });
            const groupPromise = Group.findOne({ _id: receiver });
            const [user, group] = await Promise.all([userPromise, groupPromise]);
            // console.log('group.members:', group);
            // console.log('user.:', user);
            if (user) {
                //处理单聊
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
                // console.log('get history controller [receiver:', receiver);
                res.json({
                    status: 200,
                    datas: datas
                });

            } else if (group) {
                //处理群聊
                //通过groupID查询到该群组内所有没有translatedContent字段的消息，
                //即：通过groupId查询到该群组内所有的rowMessage
                const messages = await Message.find({ group: receiver });
                let rowMessages = [];
                messages.forEach((item) => {
                    if (!item.translatedContent && item.readStatus.length != 0 && item.contentType == 1) {
                        rowMessages.push(item.toObject());
                    }
                });
                // console.log('rowMessages:', rowMessages);
                //取出每条rowMessage的sender，将sender去重
                let senderIds = rowMessages.map((item) => {
                    let id = item.sender.toString();
                    return id;
                })

                //去重
                let uniqueSenderIds = [...new Set(senderIds)];
                // console.log("uniqueSenderIds:", uniqueSenderIds);

                //-通过去重了的sender查询用户信息，
                //将查询到的sender的用户信息和sender形成映射， 方便后续进行数据拼贴
                let senderInfoMap = {}
                for (let i = 0; i < uniqueSenderIds.length; i++) {
                    let user = await User.findOne({ _id: uniqueSenderIds[i] }).select({
                        password: 0,
                    });
                    //形成映射
                    senderInfoMap[uniqueSenderIds[i]] = user;
                }

                // console.log('senderInfoMap:', senderInfoMap);

                //通过payload.uid查询到客户端自己的language
                const { language } = await User.findOne({ _id: payload.uid }, { language: 1 });
                const myLanguage = language;
                // console.log('myLanguage:', myLanguage);

                //从groupID查询到该群组内所有的message中过滤出translatedContent字段不为空，
                //并且translatedLanguage和用户自己的language相同的message
                const translatedMessages = [];
                messages.forEach((item) => {
                        if (item.translatedContent && item.translatedLanguage == myLanguage) {
                            translatedMessages.push(item.toObject());
                        }
                    })
                    //openai试用到期了，所以暂时全部都为空
                    // console.log('translatedMessages:', translatedMessages);

                //将查询到的translatedMessages内的content字段和translatedContent形成映射
                let translatedMap = {};
                for (let i = 0; i < translatedMessages.length; i++) {
                    translatedMap[translatedMessages[i].content] = translatedMessages[i].translatedContent;
                }

                //把userInfo和translatedContent绑定绑定给rowMessage
                for (let i = 0; i < rowMessages.length; i++) {
                    rowMessages[i]['userInfo'] = senderInfoMap[rowMessages[i].sender];
                    rowMessages[i]['translatedContent'] = translatedMap[rowMessages[i].content];
                }

                // console.log('rowMessages:', rowMessages);

                //最后把绑定好的message返回给客户端
                const datas = {
                    message: rowMessages,
                };

                res.json({
                    status: 200,
                    datas: datas
                });
            }
        }
    } catch (err) {
        console.log(err);
    }
};

//创建group，即聊天室,分群聊聊天室和单聊聊天室，先检测数据库有没有该单聊聊天室，群聊无所谓
module.exports.createGroup = async(req, res, next) => {
    /**
     * 创建group前先检查有无group
     */
    try {
        const { payload } = req;
        const { name, isOne2One, members } = req.body;

        //单聊聊天室
        if (isOne2One) {
            const tempName = name.split(" ");
            const name2 = tempName[1] + " " + tempName[0];
            /**
             * 由于单聊聊天室命名规则为id相加，所以聊天室名有两种情况，
             * 1.用户一点击用户二，则为传进来的name，则检查
             * 2.用户二点击用户一，除了点击自传进来的name外，还需要检查uid1+" "uid2的name
             * 
             * 
             * 
             */
            //检查是否有该聊天室
            const groupCheck1 = await Group.findOne({ name: name });
            const groupCheck2 = await Group.findOne({ name: name2 });

            const membersIds = name.split(" ");

            //如果都没有，为true，则创建group
            const finalChecke = (groupCheck1 == null && groupCheck2 == null) ? true : false;

            if (payload.uid && finalChecke) {
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
                res.json({
                    status: 200,
                    message: "room已存在|Existed",
                    group: groupCheck1 == null ? groupCheck2 : groupCheck1
                });
            }
        } else {
            //创建群聊
            const group2 = new Group({
                name: name,
                members: members,
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
             *  根据token里面的用户id找到对应的单聊的group列表，
             * 通过group列表：1.利用每个group的members找到每个group里的非自己的那个用户
             *               2.找到每个group关联的message的最新一条mesaage作为消息预览
             * 
             * 通过uid查找到所有的group
             */

            const group = await Group.find({
                members: { $in: [payload.uid] },
                // isOne2One: 1
            });

            // console.log("group:", group);
            //用来装所有取得过联系的好友的id
            let frendsId = [];

            //拿到所有取得过联系的好友的id,目的是通过id拿到对应的用户信息
            group.forEach((item) => {
                //如果是单聊,frendsId就就是member非payload.uid的那个用户
                //如果是群聊,frendsId就是groupID
                // console.log("group.forEach步骤的item:", item);
                if (item.members.length == 2) {
                    item.members.forEach((member) => {
                        if (member != payload.uid) {
                            frendsId.push(member);
                        }
                    });
                } else {
                    frendsId.push(item._id);
                }
            });

            //查找用户信息
            // let frendsData = [];
            // for (let i = 0; i < frendsId.length; i++) {
            //     const user = await User.findOne({ _id: frendsId[i] }).select({
            //         password: 0,
            //     });

            //     //toObject()方法将对象转换为json对象便于为从mongoDB里取的数据添加键值对
            //     frendsData.push(user.toObject() == undefined ? {} : user.toObject());
            // }

            let frendsData = [];
            for (let i = 0; i < frendsId.length; i++) {
                // console.log('frendsId[i]:', frendsId[i]);
                const userPromise = User.findOne({ _id: frendsId[i] }).select({
                    password: 0,
                });
                const groupPromise = Group.findOne({ _id: frendsId[i] });

                const [user, group] = await Promise.all([userPromise, groupPromise]);
                if (user) {
                    // console.log("user:", user);
                    frendsData.push(user.toObject()); //toObject()方法将对象转换为json对象便于为从mongoDB里取的数据添加键值对
                } else if (group) {
                    // console.log("group:", group);
                    frendsData.push(group.toObject());
                }
            }



            /**
             * 查找每个groupid关联的所有消息中最近的消息， 
             * 以及通过frendsData里的id和message里的sender或receiver将最新的那条消息与聊天室绑定在一起
             * */
            let notifys = [];
            for (let i = 0; i < group.length; i++) {
                let notify = await Message.find({
                        group: group[i]._id
                    })
                    // .select("content sender receiver updateAt isRead translatedContent group readStatus")
                    .sort({ updateAt: -1 }); //-1：降序，1：升序


                let notifyTemp = notify[0] ? notify[0].toObject() : {};
                // console.log('群聊notifyTemp', notifyTemp.receiver, notifyTemp.group);
                //未读条数
                //处理群聊的readStatus问题
                if (notifyTemp.receiver != undefined && notifyTemp.receiver.toString() == notifyTemp.group.toString()) {

                    console.log('群聊notifyTemp', notifyTemp);

                    notify.forEach((item) => {

                        let index = item.readStatus.findIndex((item2) => {
                            return item2.member == payload.uid;
                        });

                        if (index != -1) {
                            item.isRead = item.readStatus[index].isRead;
                        } else {
                            //说明自己是sender，既然自己是sender，说明isRead为1
                            item.isRead = 1;
                        }
                    });
                }

                notifyTemp['notreadCount'] = notify.filter((item) => {
                    return item.isRead == 0
                }).length;

                notifys.push(notifyTemp);
            }

            //用循环将最新message和frendsData以一一对应的形式捆捆绑
            for (let i = 0; i < notifys.length; i++) {
                // console.log("notifys[i]iiiiiiiii:", notifys[i]);
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
    const { ids, isOne2One } = req.body;
    try {
        const { uid } = req.payload;
        if (uid) {
            //单聊更新
            if (isOne2One) {
                //单聊直接更新message的isrea字段
                //条件更新，$ne为不等于，not equal
                await Message.updateMany({ _id: { $in: ids } }, { $set: { isRead: 1 } });
                const messages = await Message.find({ _id: { $in: ids } });
                console.log('更新成功');
                res.json({
                    status: 200,
                    message: 'Successfully update message status|更新状态为已读成功',
                    messages: messages
                });
            } else {
                //群聊更新
                //群聊更新需要更新message的readStatus字段里面对应的uid的isRead字段

                await Message.updateMany({
                    _id: { $in: ids }, //消息 id 包含在需要更新的 id 数组中
                    readStatus: { $elemMatch: { member: uid } } //匹配 member 字段等于当前用户 ID 的 readStatus
                }, {
                    $set: { "readStatus.$.isRead": 1 } //更新匹配的 readStatus 的 isRead 字段为 1
                });

                const messages2 = await Message.find({
                    _id: { $in: ids },
                    "readStatus": { $elemMatch: { "member": uid } }
                });
                console.log('更新成功');
                res.json({
                    status: 200,
                    message: 'Successfully update message status|更新状态为已读成功',
                    messages: messages2
                });

            }

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

//测试
module.exports.test = async(req, res, next) => {
    try {
        res.json({
            status: 200,
            message: '测试测试测试测试'
        })
    } catch (err) {}
}