const { baseURL } = require('../privateKeys/index.js');
// const baseURL = process.env.baseURL;

//random avatar 随机头像
module.exports.randomAvatar = () => {
    //0-29的随机数
    const randomNum = Math.round(Math.random() * 30);
    return `${baseURL}/${randomNum}.jpg`;
};

//时间格式处理
module.exports.formatDate = (date) => {
    const time = date == null ? new Date() : date;

    const year = time.getFullYear();
    const month = time.getMonth() + 1;
    const day = time.getDate();
    const hour = time.getHours();
    const minute = time.getMinutes();
    const second = time.getSeconds();

    return {
        Detailed: `${year}-${month}-${day} ${hour}:${minute}:${second}`,
        omitted: `${year}-${month}-${day}`
    };
}