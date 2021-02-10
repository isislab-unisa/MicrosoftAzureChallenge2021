var MachineType = require("../models/DAOs/MachineType.js");

exports.getVmTypeByName = function (name, callback) {

    MachineType.fetchByName(name, function (err, mType) {
        if (!err) {
            callback(null, mType);

        } else {
            callback("Errore nell'ottenimento del tipo di VM da suggerire", null);
        }

    });
}