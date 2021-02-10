var Utente = require("../models/DAOs/Utente.js");
var bcrypt = require('bcrypt');
const saltRounds = 10;

exports.login = function (username, password, callback) {

    Utente.fetchByUsername(username, function (err, user) {

        if (!err) {

            if (!user[0]) {
                callback("Utente non registrato", null);
            } else {
                bcrypt.compare(password, user[0].password, function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        if (!result) {
                            callback("Password errata", null);
                        } else {
                            user[0].password = null;
                            callback(null, user[0]);
                        }
                    }
                });
            }

        } else {
            callback(err, null);
        }

    });





}