exports.UserType = class {
    constructor(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }
    setName(name) {
        if (this.name = name) return true;
    }
};