var Tipo = require("../models/DAOs/Tipo.js");


exports.getAllTypes = function (callback) {

    Tipo.fetchAll((err, types) => {

        if (!err) {
            callback(null, types);
        } else {
            callback(err, null);
        }

    });

}