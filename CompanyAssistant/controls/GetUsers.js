var User = require("../models/DAOs/Utente");

exports.getAllUsers = function (callback) {

    User.fetchAll(function (err, users) {
        if (!err) {
            callback(null, users);
        } else {
            callback("Errore nel fetch degli utenti ");
        }
    });

}