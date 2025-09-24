class Product {
    constructor() {
        this.parts = [];
    }

    addPart(part) {
        this.parts.push(part);
    }

    showParts() {
        console.log('Product parts:', this.parts.join(', '));
    }
}

class Builder {
    constructor() {
        this.product = new Product();
    }

    addPartA() {
        this.product.addPart('PartA');
        return this;
    }

    addPartB() {
        this.product.addPart('PartB');
        return this;
    }

    addPartC() {
        this.product.addPart('PartC');
        return this;
    }

    build() {
        return this.product;
    }
}

// Example usage:
const builder = new Builder();
const product = builder.addPartA().addPartB().addPartC().build();
product.showParts();