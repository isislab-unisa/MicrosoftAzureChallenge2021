var TagVirtualMachine = require("../entities/TagVirtualMachine.js").TagVirtualMachine;
var DbConnection = require("../../utilities/DbConnection.js");
var Request = require("tedious").Request;
var TYPES = require('tedious').TYPES;


exports.fetchAll = function (callback) {

    DbConnection.createConnection(function (err, con) {

        var TagMTypes = [];


        const request = new Request(
            `SELECT  * FROM tagVirtualMachine`,
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

            TagMTypes.push(new TagVirtualMachine(element.tag,element.virtualMachine));

        });

        con.execSql(request);

    });
}


exports.fetchByTag = function (tag, callback) {

    DbConnection.createConnection(function (err, con) {

        var TagMTypes = [];


        const request = new Request(
            `SELECT  * FROM tagVirtualMachine WHERE tag = @tag`,
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

            TagMTypes.push(new TagVirtualMachine(element.tag,element.virtualMachine));

        });

        request.addParameter("tag", TYPES.VarChar, tag)

        con.execSql(request);

    });
}


exports.fetchByVirtualMachine = function (virtualMachine, callback) {

    DbConnection.createConnection(function (err, con) {

        var TagMTypes = [];

        //SELECT  * FROM tagVirtualMachine INNER JOIN virtualMachine ON virtualMachine.name  = tagVirtualMachine.virtualMachine WHERE virtualMachine.name = 'ciao'
        const request = new Request(
            `SELECT  * FROM tagVirtualMachine INNER JOIN virtualMachine ON virtualMachine.name  = tagVirtualMachine.virtualMachine WHERE virtualMachine = @virtualMachine`,
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

            TagMTypes.push(new TagVirtualMachine(element.tag,element.virtualMachine));

        });

        request.addParameter("virtualMachine", TYPES.VarChar, virtualMachine)

        con.execSql(request);

    });
}

exports.insertTagVirtualMachine = function (tag,virtualMachine, callback) {

    DbConnection.createConnection(function (err, con) {


        const request = new Request(
            `INSERT INTO tagVirtualMachine (virtualMachine,tag) VALUES (@virtualMachine,@tag)`,
            (err, rowCount) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
                con.close();
            }
        );

        request.addParameter("tag", TYPES.VarChar, tag);
        request.addParameter("virtualMachine", TYPES.VarChar, virtualMachine);

        con.execSql(request);

    });
}