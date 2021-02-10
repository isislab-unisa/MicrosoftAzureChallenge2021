var Vm = require("../entities/Vm.js").Vm;
var DbConnection = require("../../utilities/DbConnection.js");
var Request = require("tedious").Request;
var TYPES = require('tedious').TYPES;

exports.fetchAll = function (callback) {

    DbConnection.createConnection(function (err, con) {

        var vms = [];


        const request = new Request(
            `SELECT  * FROM virtualMachine`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, vms);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            vms.push(new Vm(element.idAzure, element.name, element.username, element.password, element.state, element.inUse, element.ipAddr, element.utente, element.osType, element.description));

        });

        con.execSql(request);

    });
}

exports.fetchById = function (id, callback) {

    DbConnection.createConnection(function (err, con) {

        var vms = [];


        const request = new Request(
            `SELECT  * FROM virtualMachine WHERE idAzure = @id`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, vms);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            vms.push(new Vm(element.idAzure, element.name, element.username, element.password, element.state, element.inUse, element.ipAddr, element.utente, element.osType, element.description));

        });

        request.addParameter("id", TYPES.VarChar, id)

        con.execSql(request);

    });
}

exports.fetchByName = function (name, callback) {

    DbConnection.createConnection(function (err, con) {

        var vms = [];


        const request = new Request(
            `SELECT  * FROM virtualMachine WHERE name = @name`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, vms);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            vms.push(new Vm(element.idAzure, element.name, element.username, element.password, element.state, element.inUse, element.ipAddr, element.utente, element.osType, element.description));

        });

        request.addParameter("name", TYPES.VarChar, name)

        con.execSql(request);

    });
}

exports.fetchByUsername = function (username, callback) {

    DbConnection.createConnection(function (err, con) {

        var vms = [];


        const request = new Request(
            `SELECT  * FROM virtualMachine WHERE username = @username`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, vms);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            vms.push(new Vm(element.idAzure, element.name, element.username, element.password, element.state, element.inUse, element.ipAddr, element.utente, element.osType, element.description));

        });

        request.addParameter("username", TYPES.VarChar, username)

        con.execSql(request);

    });
}

exports.fetchByState = function (state, callback) {

    DbConnection.createConnection(function (err, con) {

        var vms = [];


        const request = new Request(
            `SELECT  * FROM virtualMachine WHERE state = @state`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, vms);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            vms.push(new Vm(element.idAzure, element.name, element.username, element.password, element.state, element.inUse, element.ipAddr, element.utente, element.osType, element.description));

        });

        request.addParameter("state", TYPES.VarChar, state)

        con.execSql(request);

    });
}

exports.fetchByInUse = function (inUse, callback) {

    DbConnection.createConnection(function (err, con) {

        var vms = [];


        const request = new Request(
            `SELECT  * FROM virtualMachine WHERE inUse = @inUse`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, vms);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            vms.push(new Vm(element.idAzure, element.name, element.username, element.password, element.state, element.inUse, element.ipAddr, element.utente, element.osType, element.description));

        });

        request.addParameter("inUse", TYPES.Bit, inUse)

        con.execSql(request);

    });
}



exports.ifExist = function (name, callback) {

    DbConnection.createConnection(function (err, con) {

        var vms = [];


        const request = new Request(
            `SELECT  * FROM virtualMachine WHERE name = @name`,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    if (vms.length == 0) {

                        callback(null, false);
                    } else {
                        callback(null, true);
                    }

                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            vms.push(new Vm(element.idAzure, element.name, element.username, element.password, element.state, element.inUse, element.ipAddr, element.utente, element.osType, element.description));

        });

        request.addParameter("name", TYPES.VarChar, name)

        con.execSql(request);

    });
}

exports.insertVM = function (id, name, username, password, state, inUse, ipAddr, utente, osType, description, callback) {
    DbConnection.createConnection(function (err, con) {


        const request = new Request(
            `INSERT INTO virtualMachine VALUES (@id,@name,@username,@password,@state,@inUse,@ipAddr,@utente,@osType,@description)`,
            (err, rowCount) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
                con.close();
            }
        );

        request.addParameter("id", TYPES.VarChar, id);
        request.addParameter("name", TYPES.VarChar, name);
        request.addParameter("username", TYPES.VarChar, username);
        request.addParameter("password", TYPES.VarChar, password);
        request.addParameter("state", TYPES.VarChar, state);
        request.addParameter("inUse", TYPES.Bit, inUse);
        request.addParameter("ipAddr", TYPES.VarChar, ipAddr);
        request.addParameter("utente", TYPES.VarChar, utente);
        request.addParameter("osType", TYPES.VarChar, osType);
        request.addParameter("description", TYPES.VarChar, description);

        con.execSql(request);

    });

}



exports.updateState = function (name, state, callback) {

    DbConnection.createConnection(function (err, con) {

        const request = new Request(
            `UPDATE virtualMachine SET state = @state WHERE name = @name`,
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
        request.addParameter("state", TYPES.VarChar, state);

        con.execSql(request);

    });

}

exports.updateIp = function (name, ipAddr, callback) {

    DbConnection.createConnection(function (err, con) {

        const request = new Request(
            `UPDATE virtualMachine SET ipAddr = @ipAddr WHERE name = @name`,
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
        request.addParameter("ipAddr", TYPES.VarChar, ipAddr);

        con.execSql(request);

    });

}
exports.changeUsage = function (name, user, callback) {

    DbConnection.createConnection(function (err, con) {

        const request = new Request(
            `UPDATE virtualMachine SET inUse = ~inUse, utente = @user WHERE name = @name `,
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
        request.addParameter("user", TYPES.VarChar, user);

        con.execSql(request);

    });

}

exports.stopVM = function (name, user, callback) {

    DbConnection.createConnection(function (err, con) {

        const request = new Request(
            `UPDATE virtualMachine SET inUse = ~inUse, utente = @user WHERE name = @name `,
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
        request.addParameter("user", TYPES.VarChar, null);

        con.execSql(request);

    });

}


exports.deleteVM = function (name, callback) {
    DbConnection.createConnection(function (err, con) {

        const request = new Request(
            `DELETE FROM virtualMachine WHERE name = @name`,
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

        con.execSql(request);

    });

}


exports.fetchByTag = function (tags, callback) {

    DbConnection.createConnection(function (err, con) {

        var vms = [];

        /* SELECT * From virtualMachine Where name = (SELECT  virtualMachine FROM tagVirtualMachine INNER JOIN tag ON tag.name  = tagVirtualMachine.tag WHERE tag.name = 'trest')*/

        var query = "SELECT * From virtualMachine Where name IN (SELECT  virtualMachine FROM tagVirtualMachine INNER JOIN tag ON tag.name  = tagVirtualMachine.tag WHERE "

        var i;
        for (i = 0; i < tags.length - 1; i++) {
            query = query + "tag.name = @tag" + i + " OR "
        }

        query = query + "tag.name = @tag" + i + ")"


        const request = new Request(
            query,
            (err, rowCount) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, vms);
                }
                con.close();
            }
        );

        request.on("row", columns => {
            var element = {};
            columns.forEach(column => {
                element[column.metadata.colName + ''] = column.value
            });

            vms.push(new Vm(element.idAzure, element.name, element.username, element.password, element.state, element.inUse, element.ipAddr, element.utente, element.osType, element.description));

        });

        for (i = 0; i < tags.length; i++) {
            request.addParameter("tag" + i, TYPES.VarChar, tags[i])
        }



        con.execSql(request);

    });
}




