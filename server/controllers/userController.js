const mongoose = require('mongoose');
const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/token');



//登录login
module.exports.login = async(req, res, next) => {
    const { email, password } = req.body;

    //验证邮箱密码格式
    if (!email || !password) {
        return res.json({
            message: "email or password is empty.邮箱或密码不能为空。"
        })
    }

    //verify email
    const user = await User.findOne({ email: email });
    if (!user) {
        return res.json({
            message: "email is not exist.邮箱不存在。"
        })
    }

    //bcryptjs.compare（）返回一个布尔值
    const ispwdValid = await bcryptjs.compare(password, user.password);
    if (!ispwdValid) {
        return res.json({
            message: "password is not valid.密码无效。",
            status: 401
        });
    }

    //登录成功发送token
    const token = generateToken(user._id.toHexString());
    const data = {
        status: 200,
        token,
        ...Object.assign(user._doc),
        password: undefined,
        __v: undefined
    }

    return res.json({
        message: "User login successful.登录成功。",
        data: data
    })

};

//注册register
module.exports.register = async(req, res, next) => {
    const { email, password, username } = req.body;


    if (!username || !password) {
        return res.json({
            message: "username or password is empty.用户名和密码不能为空。"
        })
    }


    const emailRegex = /@gmail.com|@yahoo.com|@qq.com|@hotmail.com|@live.com/;
    if (!emailRegex.test(email)) {
        return res.json({
            message: "Email is not valid.邮箱域名无效。"
        })
    }

    if (username.length < 3) {
        return res.json({
            message: "Username cannot be less than 3 characters.用户名不能少于3个字符。"
        })
    }

    const userExists = await User.findOne({ username });
    if (userExists !== null) {
        return res.json({
            message: "Username already exists.用户名已存在"
        })
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
        return res.json({
            message: "Email has been used.邮箱已被使用"
        })
    }

    //写入数据库
    const user = new User({
        username: username,
        email: email,
        password: password,
        createTime: new Date()
    });
    await user.save();
    res.json({
        message: "User registration successful.注册成功。",
    })
};