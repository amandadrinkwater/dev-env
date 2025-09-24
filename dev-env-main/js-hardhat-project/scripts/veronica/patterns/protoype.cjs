class Prototype {
    constructor(proto) {
        this.proto = proto;
    }

    clone() {
        // Create a new object with the same prototype and properties
        return Object.assign(
            Object.create(Object.getPrototypeOf(this.proto)),
            this.proto
        );
    }
}

// Usage example:
const carPrototype = {
    wheels: 4,
    drive() {
        return `Driving with ${this.wheels} wheels.`;
    }
};

const prototype = new Prototype(carPrototype);

const car1 = prototype.clone();
car1.color = 'red';

const car2 = prototype.clone();
car2.color = 'blue';

console.log(car1.drive()); // Driving with 4 wheels.
console.log(car1.color);  // red

console.log(car2.drive()); // Driving with 4 wheels.
console.log(car2.color);  // blue

car1.engine = 'Honda';
console.log(car1.engine); // Honda
car2.engine = 'Toyota';
console.log(car2.engine); // Toyota