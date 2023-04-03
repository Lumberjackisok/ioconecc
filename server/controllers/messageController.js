const Message = require('../models/message');
const Group = require('../models/group');
const User = require('../models/user');



//获取用户与用户之间的聊天记录
module.exports.mssageHistory = async (req, res, next) => {
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

//创建group，即聊天室,分群聊聊天室和单聊聊天室，先检测数据库有没有该单聊聊天室，群聊无所谓
module.exports.createGroup = async (req, res, next) => {
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
module.exports.notifyList = async (req, res, next) => {
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

            console.log("group:", group);
            //用来装所有取得过联系的好友的id
            let frendsId = [];

            //拿到所有取得过联系的好友的id,目的是通过id拿到对应的用户信息
            group.forEach((item) => {
                //如果是单聊frendsId就就是member非payload.uid的那个用户
                //如果是群聊frendsId就是groupID

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
                const userPromise = User.findOne({ _id: frendsId[i] }).select({
                    password: 0,
                });
                const groupPromise = Group.findOne({ _id: frendsId[i] });

                const [user, group] = await Promise.all([userPromise, groupPromise]);
                if (user) {
                    console.log("user:", user);
                    frendsData.push(user.toObject()); //toObject()方法将对象转换为json对象便于为从mongoDB里取的数据添加键值对
                } else if (group) {
                    console.log("group:", group);
                    frendsData.push(group.toObject());
                }
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
                console.log("notify[0]:", notify[0]);

                let notifyTemp = notify[0] ? notify[0].toObject() : {};
                //未读条数
                notifyTemp['notreadCount'] = notify.filter((item) => { return item.isRead == 0 }).length;
                notifys.push(notifyTemp);
            }

            //用循环将最新message和frendsData以一一对应的形式捆捆绑
            for (let i = 0; i < notifys.length; i++) {
                console.log("notifys[i]iiiiiiiii:", notifys[i]);
                /**
                 * frendsData和notifys都是以group为出发点过滤出来的 
                 * 
                 */
                frendsData[i]["notify"] = notifys[i];

            }

            res.json({
                status: 200,
                frends: frendsData,
                // notifys: notifys,
            })
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: '获取消息预览列表失败' });
        }

    }
};

//当客户端滚动至底部后更新状态为已读
module.exports.updateMessageStatus = async (req, res, next) => {
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
module.exports.updateMessageByIds = async (req, res, next) => {
    const { ids } = req.body;

    try {
        const { uid } = req.payload;
        if (uid) {
            // for (let i = 0; i < ids.length; i++) {
            //     await Message.updateOne({ _id: ids[i] }, { isRead: 1 })
            // }
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
module.exports.test = async (req, res, next) => {
    try {
        res.json({
            status: 200,
            message: '测试测试测试测试'
        })
    } catch (err) { }
}