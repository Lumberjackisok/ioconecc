const app = require("./app");
const { port, JWT_SECRET } = require('./config');
const { verifyToken } = require('./utils/token');


//连接mongoDB
const mongoose = require('mongoose');
const { json } = require("express");
mongoose.set('strictQuery', false); //解决控制台警告提示

//全局保存uid和socket.id的映射
const onLineUserMap = new Map();

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
        //console.log('token::::', JSON.parse(socket.handshake.query.token)['token']);
        if (socket.handshake.query.token) {
            //取token
            const token = JSON.parse(socket.handshake.query.token)['token'];

            //验证token,拿到用户id
            const payload = await verifyToken(token, JWT_SECRET);
            if (payload.uid) {
                // console.log('socket.id:', socket.id);

                //将数据库的用户id与客户端连接服务器后服务器分配给客户端的socket.id映射

                onLineUserMap.set(socket.id, payload.uid);

                // console.log('token info:', payload); //{ uid: '63ca6dfd99ac36ac5e8af3b4', iat: 1675312721, exp: 1675917521 }
                socket.uid = payload.uid;
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
io.on('connection', (socket) => {
    console.log('socket.userId:', socket.uid);
    console.log('socket.Id:', socket.id);
    socket.on('message', (val, fn) => {
        // console.log(val);
        fn(socket.id);
    });
});