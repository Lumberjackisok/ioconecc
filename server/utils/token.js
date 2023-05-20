const jwt = require('jsonwebtoken');
// const { JWT_SECRET } = require('../privateKeys/index');
const JWT_SECRET = process.env.JWT_SECRET;


/**
 * jwt.sign()生成token
 * @param {*} uid 
 * @param {*} language
 * @param {*} secret 
 * @param {*} expiresIn token过期时间："2 days"，"10h"，"7d"
 */
module.exports.generateToken = (uid, language, secret, expiresIn = '7d') => {
    return jwt.sign({ uid, language }, secret || JWT_SECRET, { expiresIn });
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