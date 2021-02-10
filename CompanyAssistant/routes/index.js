var express = require('express');
var session = require('express-session');
var GetVms = require('../controls/GetVms.js');
var GetUsers = require('../controls/GetUsers.js');
var GetTypes = require('../controls/GetTypes.js');
var Login = require('../controls/Login.js');
var SendDataToBot = require('../controls/SendDataToBot.js');
var UserRegistration = require('../controls/registerUser.js');
var DeleteUser = require('../controls/deleteUser.js');
var DeleteVM = require('../controls/deleteVM.js');
var CreateVM = require('../controls/CreateVM.js');
var UpdateVms = require('../controls/UpdateVms.js');
var UseVM = require('../controls/useVM.js');
var StopVM = require('../controls/stopVM.js');
var crypto = require('../utilities/crpyto.js');
var SendQuestionToLuis = require('../controls/sendQuestionToLuis.js');
var GetVmTypeByName = require('../controls/getVmTypeByName.js');
var GetTags = require('../controls/GetTag.js');
var router = express.Router();


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('loginPage', { title: 'Effettua il login' });
});
router.get('/index', function (req, res, next) {
    if (!req.session) {
        //SE L'UTENTE NON È LOGGATO
        res.render('index', { title: 'Home Page', user: null });

    } else {
        if (!req.session.user) {
            //SE L'UTENTE NON È LOGGATO
            res.render('index', { title: 'Home Page', user: null });

        } else {
            //SE L'UTENTE È LOGGATO
            res.render('index', { title: 'Home Page', user: req.session.user });
        }
    }
});

router.get('/users', function (req, res, next) {
    if (!req.session) {
        //SE L'UTENTE NON È LOGGATO
        res.render('users', { title: 'Utenti', user: null });

    } else {
        if (!req.session.user) {
            //SE L'UTENTE NON È LOGGATO
            res.render('users', { title: 'Utenti', user: null });

        } else {
            //SE L'UTENTE È LOGGATO
            GetUsers.getAllUsers(function (err, usersFound) {

                if (!err) {

                    GetTypes.getAllTypes(function (err, typesFound) {

                        if (!err) {
                            res.render('users', { title: 'Utenti', users: usersFound, user: req.session.user, types: typesFound });
                        } else {
                            res.render('error', { title: 'Errore nel richiedere i tipi utenti', message: err });
                        }

                    });

                } else {
                    res.render('error', { title: 'Errore nel richiedere elenco utenti', message: err });
                }
            });
        }
    }
});

router.get('/vms', function (req, res, next) {

    if (!req.session) {
        //SE L'UTENTE NON È LOGGATO
        res.render('vms', { title: 'VMs', virtualMachines: null, user: null });

    } else {
        if (!req.session.user) {
            //SE L'UTENTE NON È LOGGATO
            res.render('vms', { title: 'VMs', virtualMachines: null, user: null });

        } else {
            //SE L'UTENTE È LOGGATO
            GetVms.getAllVms(function (err, vms) {

                if (!err) {

                    GetTags.getAll((err, tags) => {

                        if (!err) {

                            res.render('vms', { title: 'VMs', virtualMachines: vms, user: req.session.user, tags: tags });

                        } else {

                            res.render('error', { title: 'Errore', message: err });

                        }

                    });

                } else {
                    res.render('error', { title: 'Errore', message: err });
                }

            });
        }
    }
});

router.get('/bot', function (req, res, next) {
    if (!req.session) {
        //SE L'UTENTE NON È LOGGATO
        res.render('bot', { title: 'Company BOT', user: null, urlBot: process.env.URL_ENBEDDED_BOT });

    } else {
        if (!req.session.user) {
            //SE L'UTENTE NON È LOGGATO
            res.render('bot', { title: 'Company BOT', user: null, urlBot: process.env.URL_ENBEDDED_BOT });

        } else {
            //SE L'UTENTE È LOGGATO
            res.render('bot', { title: 'Company BOT', user: req.session.user, urlBot: process.env.URL_ENBEDDED_BOT });
        }
    }
});


router.post('/login', function (req, res, next) {
    var session = req.session;
    Login.login(req.body.username, req.body.password, function (err, user) {

        if (!err) {
            session.user = user
            session.save();
            //DOPO AVER EFFETTUATO IL LOGIN
            res.render('./index', { title: 'Home Page', user: user });
        } else {
            //NEL CASO IN CUI IL LOGIN FALLISCE
            res.render('error', { title: 'Errore', message: err });
        }

    });
});

router.get('/logout', function (req, res, next) {
    req.session.destroy;
    res.render('./index', { title: 'Company BOT', user: null });
});

router.get('/loginPage', function (req, res, next) {
    res.render('loginPage', { title: 'login' });
});


router.get('/info', function (req, res, next) {
    if (!req.session) {
        //SE L'UTENTE NON È LOGGATO
        res.render('info', { title: 'Info', user: null });

    } else {
        if (!req.session.user) {
            //SE L'UTENTE NON È LOGGATO
            res.render('info', { title: 'Info', user: null });

        } else {
            //SE L'UTENTE È LOGGATO
            res.render('info', { title: 'Info', user: req.session.user });
        }
    }
});


router.post('/sendDataToBot', function (req, res, next) {
    SendDataToBot.send(req.body.answer, req.body.question, function (err, response) {
        if (!err) {
            res.send({ "esito": 'Inserita' });

        } else {
            res.send({ "error": err });
        }
    });
});

router.post('/register', function (req, res, next) {
    UserRegistration.send(req.body.name, req.body.lastname, req.body.username, req.body.password, req.body.userType, function (err, response) {
        if (!err) {
            res.send({ "esito": 'Registato' });

        } else {
            res.send({ "error": err });
        }
    });
});

router.post('/deleteUser', function (req, res, next) {
    DeleteUser.send(req.body.username, function (err, response) {
        if (!err) {
            res.send({ "esito": 'Eliminato' });

        } else {
            res.send({ "error": err });
        }
    });
});

router.post('/deleteVM', function (req, res, next) {
    DeleteVM.send(req.body.name, function (err, response) {
        if (!err) {
            res.send({ "esito": 'Eliminata' });
        } else {
            res.send({ "error": err });
        }
    });
});

router.get('/VmCreatingDesktop', function (req, res, next) {

    if (req.query.name != null) {

        UpdateVms.updateState(req.query.name, "Creazione desktop environment", (err) => {
            if (!err) {
                res.send("done");
            } else {
                res.send("Non ok");
            }
        });

    } else {
        res.send({ "error": "Errore: req.query.name è null" });
    }

});


router.get('/VmReady', function (req, res, next) {

    if (req.query.name != null && req.query.ipAddr != null) {


        UpdateVms.updateState(req.query.name, "Vm pronta", (err) => {
            if (!err) {

                UpdateVms.updateIp(req.query.name, req.query.ipAddr, (err) => {

                    if (!err) {
                        res.send("done");
                    } else {
                        res.send("Non ok");
                    }

                });


            } else {
                res.send("Non ok");
            }
        });

    } else {
        res.send({ "error": "Errore: req.query.name è null" });
    }

});

router.post('/useVM', function (req, res, next) {

    if (req.body.name != null && req.body.user != null) {

        UseVM.changeUsage(req.body.name, req.body.user, function (err, response) {
            if (!err) {
                res.send({ "esito": 'Cambiato' });
            } else {
                res.send({ "esito": 'Non Cambiato' });
            }
        });

    } else {
        res.send({ "error": "Errore: req.body.name è null" });
    }

});

router.post('/stopVM', function (req, res, next) {

    if (req.body.name != null && req.body.user != null) {

        StopVM.changeUsage(req.body.name, req.body.user, function (err, response) {
            if (!err) {
                res.send({ "esito": 'Cambiato' });
            } else {
                res.send({ "esito": 'Non Cambiato' });
            }
        });

    } else {
        res.send({ "error": "Errore: req.body.name è null" });
    }

});

router.post('/ifVmExist', function (req, res, next) {

    if (req.query.name != null) {

        CreateVM.ifVmExistORinCreation(req.query.name, (err, vm) => {

            if (!err) {

                if (vm.length == 0) {
                    res.send({ "inCreation": false });

                } else {

                    if (vm[0].state == "Vm in creazione") {
                        var decrpyted = crypto.decrypt({ content: vm[0].password });
                        var password = decrpyted;
                        res.send({ "inCreation": true, "username": vm[0].username, "password": password, "os": vm[0].osType });
                    } else {
                        res.send({ "inCreation": false });
                    }
                }

            } else {
                res.send("errore" + err);
            }

        });

    } else {
        res.send({ "error": "Errore: req.query.name è null" });
    }

});

router.post('/sendQuestionToLuis', function (req, res, next) {

    if (req.session != null) {
        if (req.session.user != null) {
            if (req.session.user.userType == "admin") {

                SendQuestionToLuis.sendQuestionToLuis(req.body.question, function (err, response) {
                    if (!err) {
                        GetTags.getTagsByMachineType(response, (err, tags) => {
                            if (!err) {

                                GetVmTypeByName.getVmTypeByName(response, (err, vmType) => {
                                    if (!err) {
                                        res.send({ "tags": tags, "categoria": response, "os": vmType[0].operative_system, "vmSize": vmType[0].requirements });
                                    } else {
                                        res.send({ "error": err });
                                    }
                                });

                            } else {
                                res.send({ "error": err });
                            }
                        });

                    } else {
                        res.send({ "error": err });
                    }

                });

            } else { res.send({ "error": "Permesso negato" }); }
        } else { res.send({ "error": "L'utente non è loggato" }); }
    } else { res.send({ "error": "Sessione vuota" }); }
});


router.post('/createVM', function (req, res, next) {

    if (req.session != null) {
        if (req.session.user != null) {
            if (req.session.user.userType == "admin") {

                CreateVM.ifVmExist(req.body.name, function (err, exist) {

                    if (!exist) {

                        var tagsChecked = JSON.parse(req.body.tagsChecked)
                        CreateVM.createVM(req.body.name, req.body.username, req.body.password, req.body.vmSize, req.body.os, tagsChecked, function (err, DBres) {

                            if (!err) {
                                res.send({ "esito": 'creazione' });
                            } else {
                                console.log(err);
                            }


                        });

                    } else {
                        res.send({ "error": "La VM già esiste" });
                    }


                });
            } else { res.send({ "error": "Permesso negato" }); }
        } else { res.send({ "error": "L'utente non è loggato" }); }
    } else { res.send({ "error": "Sessione vuota" }); }
});

router.post('/filterByTags', function (req, res, next) {

    if (!req.session) {
        //SE L'UTENTE NON È LOGGATO
        res.render('vms', { title: 'VMs', virtualMachines: null, user: null });

    } else {
        if (!req.session.user) {
            //SE L'UTENTE NON È LOGGATO
            res.render('vms', { title: 'VMs', virtualMachines: null, user: null });

        } else {
            //SE L'UTENTE È LOGGATO

            var tags = JSON.parse(req.body.tags)
            GetVms.getByTags(tags, function (err, vms) {

                if (!err) {

                    res.send({ "virtualMachines": vms, "user": req.session.user })

                } else {
                    res.render('error', { title: 'Errore', message: err });
                }

            });
        }
    }
});

module.exports = router;