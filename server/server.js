const app = require("./app");
const { port, JWT_SECRET } = require('./config');
const { verifyToken } = require('./utils/token');
const User = require('./models/user');


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
io.use(async(socket, next) => {
    try {
        //console.log('token::::', JSON.parse(socket.handshake.query.token)['token']);
        if (socket.handshake.query.token) {
            //取token
            const token = JSON.parse(socket.handshake.query.token)['token'];

            //验证token,拿到用户id和母语
            const payload = await verifyToken(token, JWT_SECRET);
            if (payload.uid) {
                // console.log('socket.id:', socket.id);
                console.log(payload);



                // //将数据库的用户id与客户端连接服务器后服务器分配给客户端的socket.id映射
                // onLineUserMap.set(payload.uid,socket.id );

                // console.log('token info:', payload); //{ uid: '63ca6dfd99ac36ac5e8af3b4', iat: 1675312721, exp: 1675917521 }

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

    //更新数据库里的用户信息，并把更新后的返回给客户端
    const res = await User.findByIdAndUpdate(socket.uid, {
        $set: {
            isOnline: 1,
            socketId: socket.id
        }
    });
    console.log('socket.Id:', socket.id);

    /**
     * 因为每次刷新都会重连， 所以socket.id也会变，所以需要数据库更新socket.id，再返回给客户端
     * 客户端使用pinia更新服务器返回的数据
     */
    const user = await User.findOne({ _id: socket.uid });
    const data = {
        ...Object.assign(user._doc),
        password: undefined,
        __v: undefined
    };
    socket.emit('updateUserInfo', data);

    socket.on('message', (val, fn) => {
        console.log('这啥啊', val);
        console.log('在线吗', !!socket.connected[socket.uid]);
        fn(socket.id);
    });
});