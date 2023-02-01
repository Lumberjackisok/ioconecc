const app = require("./app");
const { port } = require('./config');


//连接mongoDB
const mongoose = require('mongoose');
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
        console.log('query::::', socket.handshake.query.token);
        if (socket.handshake.query.token) {
            next();
        }
    } catch (err) {
        console.log(err);
    }
});

//连接到客户端的socket，并监听自定义事件
io.on('connection', (socket) => {
    socket.on('testSocket', (val, fn) => {
        console.log('val=', val);
        fn('您好');
    });
});