exports.MachineType = class {
    constructor(name, requirements, operative_system) {
        this.name = name;
        this.requirements = requirements;
        this.operative_system = operative_system;
    }
};