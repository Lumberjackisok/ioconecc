const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

/**
 * jwt.sign()生成token
 * @param {*} uid 
 * @param {*} secret 
 * @param {*} expiresIn token过期时间："2 days"，"10h"，"7d"
 */
module.exports.generateToken = (uid, secret, expiresIn = '7d') => {
    return jwt.sign({ uid }, secret || JWT_SECRET, { expiresIn });
};

/**
 * jwt.virefy()验证token
 * @param {*} token 
 * @param {*} secret 
 * @returns 
 */
module.exports.verifyToken = (token, secret) => {
    return jwt.verify(token, secret || JWT_SECRET);
};