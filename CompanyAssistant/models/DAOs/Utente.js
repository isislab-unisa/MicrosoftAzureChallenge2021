var Utente = require("../entities/Utente.js").Utente;
var DbConnection = require("../../utilities/DbConnection.js");
var Request = require("tedious").Request;
var TYPES = require('tedious').TYPES;
var bcrypt = require('bcrypt');
const saltRounds = 10;

exports.fetchAll = function (callback) {

    DbConnection.createConnection(function (err, con) {

        var users = [];


        const request = new Request(
            `SELECT  * FROM utente ORDER BY lastname, name`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, users);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            users.push(new Utente(element.username, element.name, element.lastname, element.password, element.userType));

        });

        con.execSql(request);


    });
}


exports.fetchByUsername = function (username, callback) {

    DbConnection.createConnection(function (err, con) {

        var users = [];


        const request = new Request(
            `SELECT  * FROM utente WHERE username = @username`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, users);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            users.push(new Utente(element.username, element.name, element.lastname, element.password, element.userType));

        });

        request.addParameter("username", TYPES.VarChar, username)

        con.execSql(request);

    });
}


exports.fetchByName = function (name, callback) {

    DbConnection.createConnection(function (err, con) {

        var users = [];


        const request = new Request(
            `SELECT  * FROM utente WHERE name = @name`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, users);
                }

            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            users.push(new Utente(element.username, element.name, element.lastname, element.password, element.userType));

        });

        request.addParameter("name", TYPES.VarChar, name)

        con.execSql(request);

    });
}

exports.fetchByLastname = function (lastname, callback) {

    DbConnection.createConnection(function (err, con) {

        var users = [];


        const request = new Request(
            `SELECT  * FROM utente WHERE lastname = @lastname`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, users);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            users.push(new Utente(element.username, element.name, element.lastname, element.password, element.userType));

        });

        request.addParameter("lastname", TYPES.VarChar, lastname)

        con.execSql(request);

    });
}

exports.fetchByUserType = function (userType, callback) {

    DbConnection.createConnection(function (err, con) {

        var users = [];


        const request = new Request(
            `SELECT  * FROM utente WHERE userType = @userType`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, users);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            users.push(new Utente(element.username, element.name, element.lastname, element.password, element.userType));

        });

        request.addParameter("userType", TYPES.VarChar, userType)

        con.execSql(request);

    });
}




exports.insertUser = function (name, lastname, username, password, userType, callback) {
    bcrypt.hash(password, saltRounds, function (err, hash) {
        DbConnection.createConnection(function (err, con) {

            const request = new Request(
                `INSERT INTO utente VALUES (@username,@password,@name,@lastname,@userType)`,
                (err, rowCount) => {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                    con.close();
                }
            );

            request.addParameter("name", TYPES.VarChar, name);
            request.addParameter("lastname", TYPES.VarChar, lastname);
            request.addParameter("username", TYPES.VarChar, username);
            request.addParameter("password", TYPES.VarChar, hash);
            request.addParameter("userType", TYPES.VarChar, userType);

            con.execSql(request);

        });
    });
}

exports.deleteUser = function (username, callback) {

    DbConnection.createConnection(function (err, con) {

        const request = new Request(
            `DELETE FROM utente WHERE username = @username`,
            (err, rowCount) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
                con.close();
            }
        );

        request.addParameter("username", TYPES.VarChar, username);

        con.execSql(request);

    });

}