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
        credentials: true
    }
});

//接收客户端的连接，并获取传过来的token
io.use(async (socket, next) => {
    try {
        if (socket.handshake.query.token) {
            const token = JSON.parse(socket.handshake.query.token)['token'];

            //验证token,拿到用户id和母语
            const payload = await verifyToken(token, JWT_SECRET);
            //把uid保存到socket里面，方便用return !!io.sockets.connected[userId]判断在线用户
            socket.uid = payload.uid;
            socket.language = payload.language;
            console.log(payload);
            next();
        }
    } catch (err) { console.log(err); }
});

//连接到客户端的socket，并监听自定义事件
io.on('connection', async (socket) => {
    console.log('连接到客户端的socket');
    try {
        //每次重连socket.id都会变，更新数据库里的socketId
        const res = await User.updateOne({ _id: socket.uid }, {
            $set: {
                isOnline: 1,
                socketId: socket.id
            }
        });
        console.log('socket.Id:', socket.id);
    } catch (err) {
        console.log(err);
    }

    //监听客户端的message发消息事件
    socket.on('message', async (val, fn) => {
        console.log('message数据:', val.sendData);

        const { sendData } = val;

        //从数据库拿接收者的信息，获取到接收者的socket.id
        const receiverDatas = await User.findById({ _id: sendData.receiver });
        console.log('receiverDatas接收者数据:', receiverDatas);
        console.log('receiverDatas接收者数据socketId:', receiverDatas.socketId);

        // 从数据库拿发送者的信息，获取发送者的language，方便与接收者的作比较，如果两者的不同才进行翻译
        // const senderDatas = await User.findById({ _id: sendData.sender });

        //如果对方的language和自己的language不一样才进行翻译
        if (sendData.receiverLanguage != sendData.senderLanguage) {
            try {
                //使用openai的davinci-003进行翻译
                const translatedContent = await openAITranslate(sendData.content, sendData.receiverLanguage);
                console.log('原文：', sendData.content);
                console.log('翻译文本：', translatedContent);
                //写入数据库
                const message = new Message({
                    sender: sendData.sender,
                    receiver: sendData.receiver,
                    contentType: sendData.contentType,
                    content: sendData.content,
                    translatedContent: translatedContent,
                    // group: group._id,
                    group: sendData.groupId,
                    isRead: 0,
                    updateAt: new Date()
                });
                await message.save();
                // return message;
                // 发送成功后再查找数据库把最新的聊天记录返回过去
                const messages = await Message.find({
                    $or: [{
                        sender: sendData.sender,
                        receiver: sendData.receiver
                    }, {
                        sender: sendData.receiver,
                        receiver: sendData.sender
                    }]
                });
                //把写入的聊天记录和发送者id返回过去,方便客户端更新状态
                fn(messages);

                //如果对方在线就直接发送过去
                if (receiverDatas.socketId != '') {
                    socket.to(receiverDatas.socketId).emit('message', {
                        message: 'go get update',
                        data: messages
                    })
                }

            } catch (err) {
                console.error(err);
            }

        } else {
            try {
                //写入数据库
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
                // 发送成功后再查找数据库把最新的聊天记录返回过去
                const messages2 = await Message.find({
                    $or: [{
                        sender: sendData.sender,
                        receiver: sendData.receiver
                    }, {
                        sender: sendData.receiver,
                        receiver: sendData.sender
                    }]
                });

                fn(messages2); //成功后在客户端执行的回调，方便用来传值

                if (receiverDatas.socketId != '') {
                    socket.to(receiverDatas.socketId).emit('message', {
                        message: 'go get update',
                        data: messages2
                    })
                }
            } catch (err) {
                console.error(err);
            }
        }
    });

    //监听客户端的disconnect事件，断开连接后更新数据库的isOnline状态为0,socketId为空字符串
    socket.on('disconnect', async () => {
        const res = await User.updateOne({ _id: socket.uid }, {
            $set: {
                isOnline: 0,
                socketId: ""
            }
        })
    });
});