const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { verifyToken } = require('../utils/token');

/**
 * 这个中间件函数主要是用来验证用户身份，
 * 它检查请求中是否有一个名为 "authorization" 的请求头，
 * 如果没有，它会抛出一个错误并返回 401 状态码，并在响应中发送 "Forbidden" 信息。
 * 如果有这个请求头，它会使用 jwt.verify() 方法验证请求中的 token，
 * 并将验证结果存储在 req.payload 中，然后调用 next() 方法继续处理请求。
 *
 * 中间件使用方法：
 * 1.中间件函数在入口程序中使用app.use(middleware)调用,
 * 或在路由中使用router.use(middleware)调用。 
 * 
 * 2.如果想在所有路由之前验证用户身份，
 * 可以在 Express 应用程序中使用 app.use()将该中间件函数添加到路由之前，如下所示:
 *   app.use(authenticate);
 *   app.use('/', routes);
 * 
 * 3.如果想在某个特定路由中验证用户身份，
 * 可以在路由中使用 router.use() 来调用该中间件函数，如下所示：
 *   router.use(authenticate);
 *   router.get('/', async(req, res)=>{
 *   代码块...
 *    });
 *
 */
module.exports = async(req, res, next) => {
    try {
        if (!req.headers.authorization) throw "Forbidden!";
        const token = req.headers.authorization.split(" ")[1];
        const payload = await jwt.verify(token, JWT_SECRET);
        //req.payload储存token中的id以及token对应的其它用户信息
        req.payload = payload;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Forbidden!"
        });
    }
};