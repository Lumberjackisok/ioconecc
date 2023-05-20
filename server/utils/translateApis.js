// const { openAIKeys } = require('../privateKeys/index');
const axios = require('axios');
const openAIKeys = process.env.openAIKeys;

// const { Configuration, OpenAIApi } = require("openai");

// const configuration = new Configuration({
//     apiKey: openAIKeys //apiKey的K是大写
// });

// const openai = new OpenAIApi(configuration);

//axios封装请求
const chatGTP = async (input) => {
    try {
        let data = {
            model: "gpt-3.5-turbo",
            messages: [
                { "role": "user", "content": input }
            ]
        };

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAIKeys}`
            },
            data: data,
            //本地测试环境如果使用WARP直连，则不需要配置proxy
            // proxy: {
            //     host: "127.0.0.1",
            //     port: 7890,
            //     protocol: "http"
            // },
            // timeout: 5000
        };
        let completion = await axios(config)
            .then((response) => {
                console.log("response.data:", JSON.stringify(response.data));
                let output = response.data.choices[0].message.content.trim();
                return output
            })
            .catch((error) => {
                console.log(error);
            });
        console.log('completion:', completion);
        return completion
    } catch (e) {
        console.log(e);
    }
};

//API of openai openai的api
module.exports.openAITranslate = async (text, language) => {
    const finalyText = `Please translate the following text into easy-to-understand ${language}:"${text}"`;
    console.log(finalyText);
    let datas = await chatGTP(finalyText);
    console.log("datas:", datas)
    return datas;
};