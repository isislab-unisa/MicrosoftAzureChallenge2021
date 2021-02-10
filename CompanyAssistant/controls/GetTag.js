var TagMachineType = require('../models/DAOs/TagMachineType.js');
var Tag = require('../models/DAOs/Tag.js');


exports.getTagsByMachineType = function (machineType, callaback) {

    TagMachineType.fetchByMachineType(machineType, (err, tags) => {

        if (!err) {

            callaback(null, tags);

        } else {

            callaback(err, null);

        }


    });


}


exports.getAll = function (callaback) {

    Tag.fetchAll((err, tags) => {

        if (!err) {

            callaback(null, tags);

        } else {

            callaback(err, null);

        }


    });


}