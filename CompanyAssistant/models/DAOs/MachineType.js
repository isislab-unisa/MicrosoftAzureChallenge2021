var MachineType = require("../entities/MachineType.js").MachineType;
var DbConnection = require("../../utilities/DbConnection.js");
var Request = require("tedious").Request;
var TYPES = require('tedious').TYPES;


exports.fetchAll = function (callback) {

    DbConnection.createConnection(function (err, con) {

        var mTypes = [];


        const request = new Request(
            `SELECT  * FROM machineType`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, mTypes);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            mTypes.push(new MachineType(element.name, element.requirements, element.operative_system));

        });

        con.execSql(request);

    });
}


exports.fetchByName = function (name, callback) {

    DbConnection.createConnection(function (err, con) {

        var mTypes = [];


        const request = new Request(
            `SELECT  * FROM machineType WHERE name = @name`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, mTypes);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            mTypes.push(new MachineType(element.name, element.requirements, element.operative_system));

        });

        request.addParameter("name", TYPES.VarChar, name)

        con.execSql(request);

    });
}