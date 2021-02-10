exports.Utente = class {
    constructor(username, name, lastname, password, userType) {
        this.username = username;
        this.name = name;
        this.lastname = lastname;
        this.password = password
        this.userType = userType;
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

    getLastname() {
        return this.lastname;
    }
    setLastname(lastname) {
        if (this.lastname = lastname) return true;
    }

    getPassword() {
        return this.password;
    }
    setPassword(password) {
        if (this.password = password) return true;
    }

    getUserType() {
        return this.userType;
    }
    setUserType(type) {
        if (this.type = type) return true;
    }
};