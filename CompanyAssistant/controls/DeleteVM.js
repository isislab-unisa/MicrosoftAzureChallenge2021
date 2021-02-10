var VM = require("../models/DAOs/Vm");
const axios = require('axios')

exports.send = function (name, callback) {
    axios.get(process.env.URL_FUNCTION_DELETEVM+'?code=' + process.env.FUNCTION_DELETEVM_KEY + '==&name=' + name, {})
        .then(function (response) {
            VM.deleteVM(name, callback);
        })
        .catch(function (error) {
            callback(error, null);
        });
}