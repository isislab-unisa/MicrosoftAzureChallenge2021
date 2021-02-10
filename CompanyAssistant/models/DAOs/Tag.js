var Tag = require("../entities/Tag.js").Tag;
var DbConnection = require("../../utilities/DbConnection.js");
var Request = require("tedious").Request;
var TYPES = require('tedious').TYPES;


exports.fetchAll = function (callback) {

    DbConnection.createConnection(function (err, con) {

        var tags = [];


        const request = new Request(
            `SELECT  * FROM tag`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, tags);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            tags.push(new Tag(element.name));

        });

        con.execSql(request);

    });
}


exports.fetchByName = function (name, callback) {

    DbConnection.createConnection(function (err, con) {

        var tags = [];


        const request = new Request(
            `SELECT  * FROM tag WHERE name = @name`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, tags);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            tags.push(new Tag(element.name));

        });

        request.addParameter("name", TYPES.VarChar, name)

        con.execSql(request);

    });
}



exports.insertMoreTags = function (tags, callback) {

    var i;
    var j = 0;
    if (tags.length == 0) {
        callback(null);
    }
    else {
        for (i = 0; i < tags.length; i++) {

            DbConnection.createConnection(function (err, con) {

                var query = "BEGIN IF NOT EXISTS (SELECT * FROM tag WHERE name = @tag) BEGIN INSERT INTO tag (name) VALUES (@tag) END END";

                const request = new Request(
                    query,
                    (err, rowCount) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null);
                        }
                        con.close();
                    }
                );
                request.addParameter("tag", TYPES.VarChar, tags[j]);
                j++;


                con.execSql(request);



            });

        }
    }
}

