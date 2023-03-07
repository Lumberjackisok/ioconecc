const { openAIKeys } = require('../privateKeys/index');
const axios = require('axios');


const { Configuration, OpenAIApi } = require("openai");

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
            proxy: {
                host: "127.0.0.1",
                port: 7890,
                protocol: "http"
            }
        };
        let completion = await axios(config)
            .then((response) => {
                console.log("response.data:", JSON.stringify(response.data));
                let output = response.data.choices[0].message.content.trim();
                return output
            })
            .catch((error) => {
                console.log(error, 'error in calling chat completion');
            });
        console.log('CHATGTP response:', completion);
        return completion
    } catch (e) {
        console.log(e, ' error in the callChatGTP function');
    }
};

//API of openai openai的api
module.exports.openAITranslate = async (text, language) => {
    const finalyText = `Please translate the following text into easy-to-understand ${language}:"${text}"`;
    console.log(finalyText);
    let datas = await chatGTP(finalyText);
    console.log("datas:", datas)
    return datas;
    // try {

    //     const completion = await openai.createChatCompletion({
    //         model: "gpt-3.5-turbo",
    //         messages: [
    //             { "role": "user", "content": finalyText }
    //         ]
    //     });
    //     console.log('completion:', completion.data);

    //     // console.log("completion:", completion.data.choices[0].message.content.trim());
    //     if (completion.data.choices[0].message) {
    //         return completion.data.choices[0].message.content.trim();
    //     }

    //     // gpt - 3.5 - turbo不能用了， 测试返回到text - davinci - 003（也不能用）
    //     // const completion = await openai.createCompletion({
    //     //     "model": "text-davinci-003",
    //     //     "prompt": `${finalyText}`,
    //     //     "max_tokens": 2500,
    //     // });
    //     // console.log(completion.data.choices[0].text);
    //     // console.log('completion:', completion);
    //     // if (completion.data.choices[0]) {
    //     //     return completion.data.choices[0].text.trim();
    //     // }

    // } catch (error) {
    //     console.log('出错误了：', error);
    //     // if (error.response) {
    //     //     console.error(error.response.status, error.response.data);

    //     // } else {
    //     //     console.error(`Error with OpenAI API request: ${error.message}`);

    //     // }
    // }
};