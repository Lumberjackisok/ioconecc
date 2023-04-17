const app = require("./app");
const { port, JWT_SECRET } = require('./config');
const { verifyToken } = require('./utils/token');
const { openAITranslate } = require('./utils/translateApis');
const User = require('./models/user');
const Message = require('./models/message');
// const Group = require('./models/group');


//连接mongoDB
const mongoose = require('mongoose');
// const { json } = require("express");
mongoose.set('strictQuery', false); //解决控制台警告提示



const connectDb = () => {
    mongoose.connect('mongodb://localhost:27017/ioconec', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err) => {
        if (err) {
            setTimeout(() => {
                connectDb();
            }, 1000);
            console.log('数据库连接错误:', err);
            return;
        }
        console.log('数据库连接成功!');
    });
}

connectDb();
//连接mongoDB

//测试服务器

// app.get('/', async(req, res) => {
//     const data = {
//         code: 200,
//         msg: "服务器测试hello"
//     };
//     res.send(data);
// });
//测试服务器

//服务器
const httpServer = app.listen(port, () => {
    console.log("终端打印:Listening on port 8000");
});

//实例化socket.io并挂载服务器
const io = require('socket.io')(httpServer, {
    allowEIO3: true,
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
        // blacklist: ['https://api.openai.com/v1/chat/completions'],
    }
});

//接收客户端的连接，并获取传过来的token
io.use(async(socket, next) => {
    try {
        if (socket.handshake.query.token) {
            const token = JSON.parse(socket.handshake.query.token)['token'];

            //验证token,拿到用户id和母语
            const payload = await verifyToken(token, JWT_SECRET);
            //把uid也保存到socket里面
            socket.uid = payload.uid;
            socket.language = payload.language;

            await User.updateOne({ _id: payload.uid }, {
                $set: {
                    isOnline: 1,
                    socketId: socket.id
                }
            });
            // console.log(payload);
            next();
        }
    } catch (err) { console.log(err); }
});

//连接到客户端的socket，并监听自定义事件
io.on('connection', async(socket) => {
    // console.log('连接到客户端的socket');
    // console.log('socket.Id:', socket.id);
    // try {
    //     //每次重连socket.id都会变，更新数据库里的socketId
    //     await User.updateOne({ _id: socket.uid }, {
    //         $set: {
    //             isOnline: 1,
    //             socketId: socket.id
    //         }
    //     });

    // } catch (err) {
    //     console.log(err);
    // }

    //监听客户端的disconnect事件，断开连接后更新数据库的isOnline状态为0,socketId为空字符串
    socket.on('disconnect', async() => {
        await User.updateOne({ _id: socket.uid }, {
            $set: {
                isOnline: 0,
                socketId: ""
            }
        })
    });

    //加入群组
    socket.on('join room', (goupId) => {
        socket.join(goupId);
    });

    //离开群组
    socket.on('leave room', (goupId) => {
        socket.leave(goupId);
    });

    //监听客户端的message发消息事件
    socket.on('message', async(val, fn) => {
        console.log('message数据:', val.sendData);

        const { sendData } = val;

        //通过sendData的isOne2One字段判断是否为群聊，单聊群聊分开处理
        let isOne2One = sendData.isOne2One;

        //处理单聊
        if (isOne2One) {
            //从数据库拿接收者的信息，获取到接收者的socket.id
            const receiverDatas = await User.findById({ _id: sendData.receiver }).select('-password');
            // console.log('receiverDatas接收者数据:', receiverDatas);
            // console.log('receiverDatas接收者数据socketId:', receiverDatas.socketId);

            // 从数据库拿发送者的信息，获取发送者的language，方便与接收者的作比较，如果两者的不同才进行翻译
            // const senderDatas = await User.findById({ _id: sendData.sender });

            //如果对方的language和自己的language不一样才进行翻译
            if (sendData.receiverLanguage != sendData.senderLanguage) {
                try {
                    //使用openai进行翻译
                    const translatedContent = await openAITranslate(sendData.content, sendData.receiverLanguage);
                    // console.log('原文：', sendData.content);
                    // console.log('翻译文本：', translatedContent);
                    //写入数据库
                    const message = new Message({
                        sender: sendData.sender,
                        receiver: sendData.receiver,
                        contentType: sendData.contentType,
                        content: sendData.content,
                        translatedContent: translatedContent,
                        group: sendData.groupId,
                        isRead: 0,
                        updateAt: new Date()
                    });
                    await message.save();

                    // 发送成功后再查找数据库把最新的聊天记录返回过去
                    const sendmessage = [{
                            sender: sendData.sender,
                            receiver: sendData.receiver,
                            contentType: sendData.contentType,
                            content: sendData.content,
                            translatedContent: translatedContent,
                            group: sendData.groupId,
                            isRead: 0,
                            updateAt: new Date()
                        }]
                        //把写入的聊天记录和发送者id返回过去,方便客户端更新状态
                    fn(sendmessage);

                    //如果对方在线就直接发送过去
                    if (receiverDatas.socketId != '') {
                        socket.to(receiverDatas.socketId).emit('message', {
                            message: 'go get update',
                            data: sendmessage
                        })
                    }

                } catch (err) {
                    console.error(err);
                }

            } else {
                try {
                    //如果对方母语和自己母语一样就直接写入数据库
                    const message2 = new Message({
                        sender: sendData.sender,
                        receiver: sendData.receiver,
                        contentType: sendData.contentType,
                        content: sendData.content,
                        group: sendData.groupId,
                        // translatedContent: '',
                        isRead: 0,
                        updateAt: new Date()
                    });
                    await message2.save();
                    // return message;

                    const sendmessage2 = [{
                        sender: sendData.sender,
                        receiver: sendData.receiver,
                        contentType: sendData.contentType,
                        content: sendData.content,
                        group: sendData.groupId,

                        isRead: 0,
                        updateAt: new Date()
                    }]

                    fn(sendmessage2); //成功后在客户端执行的回调，方便用来传值

                    if (receiverDatas.socketId != '') {
                        socket.to(receiverDatas.socketId).emit('message', {
                            message: 'go get update',
                            data: sendmessage2
                        })
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        } else {
            try {
                //处理群聊
                console.log('members:', sendData.members);

                //先处理好readStatus字段
                const readStatus = sendData.members.map((item) => {
                        return {
                            member: item,
                            isRead: 0
                        }
                    })
                    // console.log("readStatus:", readStatus);
                    //row message，每条消息都有一条没翻译过消息
                const rowMessage = new Message({
                    sender: sendData.sender,
                    receiver: sendData.receiver,
                    contentType: sendData.contentType,
                    content: sendData.content,
                    group: sendData.group,
                    readStatus: readStatus,
                    isRead: 0,
                    updateAt: new Date()
                });
                await rowMessage.save();

                //拿到members的个人信息
                const users = await Promise.all(sendData.members.map(async(item) => {
                    const user = await User.findById({ _id: item }).select('-password');
                    return user;
                }));
                console.log('users:', users);
                /*
                 * 利用member拿到对应的用户， 将对应的母语进行翻译。
                 * 过滤掉相同母语的member， 根据母语去重， 对于母语相同的member， 只翻译一次。
                 * 去重之后， 如果socketId不为空的话， 直接向socketId对应的客户端发送过去。
                 * 最后保存到数据库。
                 */

                const exceptedUsers = Array.from(users.reduce((map, obj) => {
                    return map.set(obj.language, obj);
                }, new Map()).values());

                console.log('exceptedMembers:', exceptedUsers);

                // const translate = await Promise.all(exceptedUsers.map(async (item, index) => {
                //     //如果sender的母语和member的母语不一样才翻译
                //     if (item.language != sendData.senderLanguage) {
                //         const translatedContent = await openAITranslate(sendData.content, item.language);
                //     }
                // }))

                for (let i = 0; i < exceptedUsers.length; i++) {
                    //如果sender的母语和member的母语不一样才翻译
                    if (exceptedUsers[i].language != sendData.senderLanguage) {
                        const translatedContent = await openAITranslate(sendData.content, exceptedUsers[i].language);
                        //写入数据库
                        const message = new Message({
                            sender: sendData.sender,
                            receiver: sendData.receiver,
                            contentType: sendData.contentType,
                            content: sendData.content,
                            translatedContent: translatedContent,
                            translatedLanguage: exceptedUsers[i].language,
                            group: sendData.group,
                            updateAt: new Date()
                        });
                        await message.save();

                        //写入成功后把该条消息发送过去
                        const sendMessage = [{
                            sender: sendData.sender,
                            userInfo: sendData.userInfo,
                            receiver: sendData.receiver,
                            contentType: sendData.contentType,
                            content: sendData.content,
                            readStatus: readStatus,
                            translatedContent: translatedContent,
                            translatedLanguage: exceptedUsers[i].language,
                            group: sendData.group,
                            isRead: 0,
                            updateAt: new Date() / 1000
                        }]

                        if (exceptedUsers[i].socketId != '') {
                            socket.to(exceptedUsers[i].socketId).emit('message', {
                                message: 'go get update',
                                data: sendMessage
                            })
                        }
                    } else {
                        const sendMessage2 = [{
                            sender: sendData.sender,
                            userInfo: sendData.userInfo,
                            receiver: sendData.receiver,
                            contentType: sendData.contentType,
                            content: sendData.content,
                            readStatus: readStatus,

                            group: sendData.group,
                            isRead: 0,
                            updateAt: new Date() / 1000
                        }]

                        if (exceptedUsers[i].socketId != '') {
                            socket.to(exceptedUsers[i].socketId).emit('message', {
                                message: 'go get update',
                                data: sendMessage2
                            })
                        }
                    }

                }

            } catch (err) {
                console.log(err);
            }


        }


    });


});