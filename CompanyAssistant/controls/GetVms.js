var Vm = require("../models/DAOs/Vm");

exports.getAllVms = function (callback) {

    Vm.fetchAll(function (err, vms) {
        if (!err) {
            callback(null, vms);
        } else {
            callback("Errore nel fetch delle vm ");
        }
    });

}


exports.getByTags = function (tags, callback) {

    Vm.fetchByTag(tags, function (err, vms) {
        if (!err) {
            callback(null, vms);
        } else {
            callback("Errore nel fetch delle vm ");
        }
    });

}