var VM = require("../models/DAOs/Vm");

exports.changeUsage = function (name, user, callback) {

    VM.changeUsage(name, user, function (err) {

        if (!err) {
            callback(null);
        } else {
            callback(err);
        }

    });

}