var UserType = require("../entities/Tipo.js").UserType;
var DbConnection = require("../../utilities/DbConnection.js");
var Request = require("tedious").Request;
var TYPES = require('tedious').TYPES;


exports.fetchAll = function (callback) {

    DbConnection.createConnection(function (err, con) {

        var types = [];


        const request = new Request(
            `SELECT  * FROM tipo`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, types);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            types.push(new UserType(element.name));

        });

        con.execSql(request);

    });
}


exports.fetchByName = function (name, callback) {

    DbConnection.createConnection(function (err, con) {

        var types = [];


        const request = new Request(
            `SELECT  * FROM tipo WHERE name = @name`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, types);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            types.push(new UserType(element.name));

        });

        request.addParameter("name", TYPES.VarChar, name)

        con.execSql(request);

    });
}