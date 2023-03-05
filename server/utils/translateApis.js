const { Configuration, OpenAIApi } = require("openai");
const { openAIKeys } = require('../privateKeys/index');

const configuration = new Configuration({
    apiKey: openAIKeys //apiKey的K是大写
});

const openai = new OpenAIApi(configuration);

//API of openai openai的api
module.exports.openAITranslate = async(text, language) => {
    let finalyText = `Please translate the following text into easy-to-understand ${language}:"${text}"`;
    console.log(finalyText);
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: finalyText }]
        });

        console.log("completion:", completion.data.choices[0].message.content.trim());
        if (completion.data.choices[0].message) {
            return completion.data.choices[0].message.content.trim();
        }

        // gpt - 3.5 - turbo不能用了， 所以返回到text - davinci - 003
        // const completion = await openai.createCompletion({
        //     "model": "text-davinci-003",
        //     "prompt": `${finalyText}`,
        //     "max_tokens": 2500,
        // });
        // console.log(completion.data.choices[0].text);
        // console.log('completion:', completion);
        // if (completion.data.choices[0]) {
        //     return completion.data.choices[0].text.trim();
        // }

    } catch (error) {
        console.log('出错误了：', error);
        // if (error.response) {
        //     console.error(error.response.status, error.response.data);

        // } else {
        //     console.error(`Error with OpenAI API request: ${error.message}`);

        // }
    }
};