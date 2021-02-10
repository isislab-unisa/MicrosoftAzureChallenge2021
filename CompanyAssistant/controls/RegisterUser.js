var User = require("../models/DAOs/Utente");

exports.send = async function (name, lastname, username, password, userType, callback) {
    User.insertUser(name, lastname, username, password, userType, callback)
}