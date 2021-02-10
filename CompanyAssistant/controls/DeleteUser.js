var User = require("../models/DAOs/Utente");

exports.send = async function (username, callback) {
    User.deleteUser(username, callback)
}