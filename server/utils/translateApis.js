const { Configuration, OpenAIApi } = require("openai");
const { openAIKeys } = require('../privateKeys/index');

const configuration = new Configuration({
    apiKey: openAIKeys //apiKey的K是大写
});

const openai = new OpenAIApi(configuration);

//API of openai openai的api
module.exports.openAITranslate = async(text, language) => {
    // let prefix = `Please translate the following text into simple and understandable ${language}:`;
    // text = prefix + text;
    let finalyText = `Please translate the following text into easy-to-understand ${language}:"${text}"`;
    console.log(finalyText);
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: finalyText }],
            // "prompt": `${finalyText}`,
            // "max_tokens": 2500,
            // "temperature": 1,
            // "top_p": 1,
            // "n": 1,
        });

        // return completion.data.choices[0].text;
        console.log("completion:", completion.data.choices[0].message.content.trim());
        if (completion.data.choices[0].message) {
            return completion.data.choices[0].message.content.trim();
        }

    } catch (error) {
        console.log(error);
    }
};





//API of deepl
module.exports.deeplTranslate = async(text, language) => {

};