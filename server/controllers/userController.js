const mongoose = require('mongoose');
const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const { generateToken } = require('../utils/token');
const {
    randomAvatar
} = require('../utils/tinyTools');




//登录login
module.exports.login = async(req, res, next) => {
    const { email, password } = req.body;
    // console.log('email:', email); //可以正常打印
    //验证邮箱密码格式
    if (!email || !password) {
        return res.json({
            message: "email or password is empty.|邮箱或密码不能为空"
        })
    }

    //verify email
    const user = await User.findOne({ email: email });
    if (!user) {
        return res.json({
            message: "email is not exist.|邮箱不存在"
        })
    }


    //update login time
    const updateLoginTime = await user.update({
        $set: {
            'lastLogin': 'Privacy'
        }
    });

    //bcryptjs.compare（）返回一个布尔值
    const ispwdValid = await bcryptjs.compare(password, user.password);
    if (!ispwdValid) {
        return res.json({
            message: "password is not valid.|密码无效",
            status: 401
        });
    }

    //登录成功发送token
    const token = generateToken(user._id.toHexString());
    const data = {
        token,
        ...Object.assign(user._doc),
        password: undefined,
        __v: undefined
    }

    return res.json({
        status: 200,
        message: "User login successful.|登录成功",
        data: data
    })

};

//注册register
module.exports.register = async(req, res, next) => {
    const { email, username, password, language } = req.body;


    if (!username || !password) {
        return res.json({
            message: "username or password is empty.|用户名和密码不能为空"
        })
    }


    const emailRegex = /@gmail.com|@yahoo.com|@qq.com|@hotmail.com|@live.com/;
    if (!emailRegex.test(email)) {
        return res.json({
            message: "Email is not valid.|邮箱域名无效"
        })
    }

    if (username.length < 3) {
        return res.json({
            message: "Username cannot be less than 3 characters.|用户名不能少于3个字符"
        })
    }

    const userExists = await User.findOne({ username });
    if (userExists !== null) {
        return res.json({
            message: "Username already exists.|用户名已存在"
        })
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
        return res.json({
            message: "Email has been used.|邮箱已被使用"
        })
    }

    const avatar = randomAvatar();



    //写入数据库
    const user = new User({
        username: username,
        email: email,
        password: password,
        language: language,
        avatar: avatar,
        createTime: new Date()
    });
    await user.save();
    res.json({
        message: "User registration successful.|注册成功",
        status: 200
    })



};

//查找
module.exports.search = async(req, res, next) => {
    const { username } = req.query;
    // const token = req.headers['authorization'].replace('Bearer ', '');
    // console.log(token);
    console.log('搜索：', username);

    //$regex: username模糊查询，$options: 'i'不区分大小写
    const user = await User.find({ username: { $regex: username, $options: 'i' } });

    const users = user.map(item => { //不展示密码
        const newItem = {...item._doc };
        newItem.password = undefined;
        newItem.__v = undefined;
        return newItem;
    });

    // const update = await User.updateMany({ 'avatar': '' }, {
    //     $set: {
    //         'avatar': `${randomAvatar()}`
    //     }
    // });

    // const update = await User.find({});
    // update.forEach(async item => {
    //     let avatar = randomAvatar();
    //     await item.update({
    //         $set: {
    //             'avatar': avatar
    //         }
    //     })
    // })




    return res.json({
        status: 200,
        message: "User search successful.|搜索成功",
        users
    })
};

module.exports.test = async(req, res, next) => {
    const { uid } = req.headers.token;
    console.log(uid);
    return res.json({
        message: "hello",
        status: 20000
    })
}