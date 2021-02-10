var TagMachineType = require("../entities/TagMachineType.js").TagMachineType;
var DbConnection = require("../../utilities/DbConnection.js");
var Request = require("tedious").Request;
var TYPES = require('tedious').TYPES;


exports.fetchAll = function (callback) {

    DbConnection.createConnection(function (err, con) {

        var TagMTypes = [];


        const request = new Request(
            `SELECT  * FROM tagMachineType`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, TagMTypes);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            TagMTypes.push(new TagMachineType(element.tag,element.machineType));

        });

        con.execSql(request);

    });
}


exports.fetchByTag = function (tag, callback) {

    DbConnection.createConnection(function (err, con) {

        var TagMTypes = [];


        const request = new Request(
            `SELECT  * FROM tagMachineType WHERE tag = @tag`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, TagMTypes);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            TagMTypes.push(new TagMachineType(element.tag,element.machineType));

        });

        request.addParameter("tag", TYPES.VarChar, tag)

        con.execSql(request);

    });
}


exports.fetchByMachineType = function (machineType, callback) {

    DbConnection.createConnection(function (err, con) {

        var TagMTypes = [];


        const request = new Request(
            `SELECT  * FROM tagMachineType WHERE machineType = @machineType`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, TagMTypes);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            TagMTypes.push(new TagMachineType(element.tag,element.machineType));

        });

        request.addParameter("machineType", TYPES.VarChar, machineType)

        con.execSql(request);

    });
}