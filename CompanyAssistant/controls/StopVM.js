var VM = require("../models/DAOs/Vm");

exports.changeUsage = function (name, user, callback) {

    VM.stopVM(name, user, function (err) {

        if (!err) {
            callback(null);
        } else {
            callback(err);
        }

    });

}