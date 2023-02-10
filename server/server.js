const app = require("./app");
const { port, JWT_SECRET } = require('./config');
const { verifyToken } = require('./utils/token');
const { openAITranslate } = require('./utils/translateApis');
const User = require('./models/user');
const Message = require('./models/message');


//连接mongoDB
const mongoose = require('mongoose');
const { json } = require("express");
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
io.use(async(socket, next) => {
    try {
        //console.log('token::::', JSON.parse(socket.handshake.query.token)['token']);
        if (socket.handshake.query.token) {
            //取token
            const token = JSON.parse(socket.handshake.query.token)['token'];

            //验证token,拿到用户id和母语
            const payload = await verifyToken(token, JWT_SECRET);
            if (payload.uid) {
                //每次重连socket.id都会变，更新数据库里的socketId
                const res = await User.updateOne({ _id: payload.uid }, {
                    $set: {
                        isOnline: 1,
                        socketId: socket.id
                    }
                });
                console.log('socket.Id:', socket.id);


                //把uid保存到socket里面，方便用return !!io.sockets.connected[userId]判断在线用户
                socket.uid = payload.uid;
                socket.language = payload.language;
                next();
            } else {
                throw new Error('Token verification failed.|token验证失败');
            }
        }
    } catch (err) {
        console.log(err);
    }
});

//连接到客户端的socket，并监听自定义事件
io.on('connection', async(socket) => {
    // console.log('用户id:', socket.uid);
    // console.log('用户语言:', socket.language);


    //监听客户端的message发消息事件
    socket.on('message', async(val, fn) => {
        console.log('message数据:', val.datas);
        // console.log('在线吗', !!socket.connected[socket.uid]);

        //从数据库拿接收者的信息，获取到接收者的socket.id
        const receiverDatas = await User.findById({ _id: val.datas.receiver });
        console.log('receiverDatas接收者数据:', receiverDatas);

        //使用openai的davinci-003进行翻译
        const traslatedContent = await openAITranslate(val.datas.content, val.datas.receiverLanguage);
        console.log('原文：', val.datas.content);
        console.log('翻译文本：', traslatedContent);

        //写入数据库
        const message = new Message({
            sender: val.datas.sender,
            receiver: val.datas.receiver,
            contentType: val.datas.contentType,
            content: val.datas.content,
            traslatedContent: traslatedContent,
            isRead: 0,
            updateAt: new Date()
        });

        try {
            await message.save();
            // return message;
        } catch (err) {
            console.error(err);
        }

        fn(traslatedContent);
    });

    //监听客户端的disconnect事件，断开连接后更新数据库的isOnline状态为0
    socket.on('disconnect', async() => {
        const res = await User.updateOne({ _id: socket.uid }, {
            $set: {
                isOnline: 0
            }
        })
    });
});