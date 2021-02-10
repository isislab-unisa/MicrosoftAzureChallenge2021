const axios = require('axios');

exports.sendQuestionToLuis = function (question, callback) {


    axios.get(process.env.URL_LUIS+'/prediction/v3.0/apps/' + process.env.SUBSCRIPTION_LUIS + '/slots/staging/predict?subscription-key=' + process.env.SUBSCRIPTION_KEY + '&verbose=true&show-all-intents=true&log=true&query=' + question, { headers: { 'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY_LUIS } })
        .then(function (response) {
            callback(null, response.data.prediction.topIntent);

        })
        .catch(function (error) {

            callback(error, null);
        });

}
