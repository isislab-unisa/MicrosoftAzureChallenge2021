const axios = require('axios')

const refreshKB = function (callback) {
    try {
        return axios({
            url: process.env.URL_QNA_MAKER+'/v4.0/knowledgebases/' + process.env.KNOWLEDGEBASES_ID,
            method: 'post',
            headers: { "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY_BOT },

        })
    } catch (error) {
        console.error("Errore aggiornamento KB " + error)
        callback(error, null);
    }
}

const insertData = function (answer, question, callback) {
    try {
        return axios({
            url: 'https://companyassistantbotqna.cognitiveservices.azure.com/qnamaker/v4.0/knowledgebases/' + process.env.KNOWLEDGEBASES_ID,
            method: 'patch',
            headers: { "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY_BOT },
            data: {
                "add": {
                    "qnaList": [{
                        "id": 0,
                        "answer": answer,
                        "source": "Problems",
                        "questions": [
                            question
                        ],
                    }]
                }
            }
        }).then(function (response) { setTimeout(function () { refreshKB(callback) }, 3000); });
    } catch (error) {
        console.error("Errore inserimento domanda " + error)
        callback(error, null);
    }
}



exports.send = async function (answer, question, callback) {
    // Aggiungo domanda e risposta alla KB
    insertData(answer, question, callback)
    callback(null, "inserita");
}