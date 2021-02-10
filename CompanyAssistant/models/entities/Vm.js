exports.Vm = class {
    constructor(idAzure, name, username, password, state, inUse, ipAddr, utente, osType, description) {
        this.idAzure = idAzure;
        this.name = name;
        this.username = username;
        this.password = password;
        this.state = state;
        this.inUse = inUse;
        this.ipAddr = ipAddr;
        this.utente = utente;
        this.osType = osType;
        this.description = description;
    }

    getUsername() {
        return this.username;
    }
    setUsername(username) {
        if (this.username = username) return true;
    }

    getName() {
        return this.name;
    }
    setName(name) {
        if (this.name = name) return true;
    }

    getIdAzure() {
        return this.idAzure;
    }
    setIdAzure(idAzure) {
        if (this.idAzure = idAzure) return true;
    }

    getPassword() {
        return this.password;
    }
    setPassword(password) {
        if (this.password = password) return true;
    }

    getState() {
        return this.state;
    }
    setState(stte) {
        if (this.state = state) return true;
    }
};