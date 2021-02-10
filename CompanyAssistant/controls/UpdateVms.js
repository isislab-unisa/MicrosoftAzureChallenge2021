var Vm = require("../models/DAOs/Vm");

exports.updateState = function (name, state, callback) {

    Vm.updateState(name, state, function (err) {

        if (!err) {
            callback(null);
        } else {
            callback(err);
        }

    });

}

exports.updateIp = function (name, ip, callback) {

    Vm.updateIp(name, ip, function (err) {

        if (!err) {
            callback(null);
        } else {
            callback(err);
        }

    });

}