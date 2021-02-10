var Connection = require("tedious").Connection;

// Create connection to database
const config = {
    authentication: {
        options: {
            userName: process.env.DB_USER, 
            password: process.env.DB_PASS 
        },
        type: "default"
    },
    server: process.env.DB_HOST, 
    options: {
        database: process.env.DB_NAME, 
        encrypt: true
    }
};

exports.createConnection = function (callback) {

    const connection = new Connection(config);
    connection.connect(function (err) {

        if (!err) {
            callback(null, connection)

        } else {
            callback(err, null)
        }

    });

}
