const { Configuration, OpenAIApi } = require("openai");
const { openAIKeys } = require('../privateKeys/index');

const configuration = new Configuration({
    apiKey: openAIKeys //apiKey的K是大写
});

const openai = new OpenAIApi(configuration);

//API of openai openai的api
module.exports.openAITranslate = async(text, language) => {

    let prefix = `Please translate the following text into simple and understandable ${language}:`;
    text = prefix + text;

    console.log(text);
    try {
        const completion = await openai.createCompletion({
            "model": "text-davinci-003",
            "prompt": `${text}`,
            // "temperature": 1,
            // "top_p": 1,
            // "n": 1,
            "max_tokens": 2500,
        });

        // return completion.data.choices[0].text;
        if (completion.data.choices[0].text) {
            return completion.data.choices[0].text.trim();
        }

    } catch (error) {
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
        }
    }
};

//API of deepl
module.exports.deeplTranslate = async(text, language) => {

};