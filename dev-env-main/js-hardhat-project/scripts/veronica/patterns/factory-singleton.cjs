/**
 * Factory Pattern Example
 *
 * If a product's creation process involves asynchronous operations (e.g., ProductC's static createAsync method),
 * you should use factory.createAsync('ProductC') to ensure all async initialization is completed before using the instance.
 *
 * If you are sure that you do not need the async setup, or if the product does not require it, you can use the synchronous
 * factory.create('ProductC') method instead.
 *
 * In summary:
 *   - Use createAsync if the product has async setup logic you need to wait for.
 *   - Use create if the product does not require async setup or you want to skip it.
 */

class ProductInterface {
    constructor() {
        if (new.target === ProductInterface) {
            throw new TypeError('Cannot instantiate an interface directly');
        }
        if (typeof this.operation !== 'function') {
            throw new TypeError('Must override method operation');
        }
        if (typeof this.getName !== 'function') {
            throw new TypeError('Must override method getName');
        }
        if (typeof this.getPrice !== 'function') {
            throw new TypeError('Must override method getPrice');
        }
        if (typeof this.getDescription !== 'function') {
            throw new TypeError('Must override method getDescription');
        }
    }
    static testProductInterfaceCompliance(ProductClass, name) {
        const instance = ProductClass.getInstance ? ProductClass.getInstance() : new ProductClass();
        const requiredMethods = ['operation', 'getName', 'getPrice', 'getDescription'];
        for (const method of requiredMethods) {
            if (typeof instance[method] !== 'function') {
                throw new Error(`${name} does not implement required method: ${method}`);
            }
        }
        console.log(`${name} implements all required interface methods.`);
    }
}



// Interface for all products
class ProductInterface {
    constructor() {
        if (new.target === ProductInterface) {
            throw new TypeError('Cannot instantiate an interface directly');
        }
        if (typeof this.operation !== 'function') {
            throw new TypeError('Must override method operation');
        }
        if (typeof this.getName !== 'function') {
            throw new TypeError('Must override method getName');
        }
        if (typeof this.getPrice !== 'function') {
            throw new TypeError('Must override method getPrice');
        }
        if (typeof this.getDescription !== 'function') {
            throw new TypeError('Must override method getDescription');
        }
    }
}

class Factory {
    constructor() {
        this.registry = {};
        this.singletons = {};
        // Register default products
        this.register('ProductA', ProductA);
        this.register('ProductB', ProductB);
    }

    register(type, ProductClass) {
        ProductInterface.testProductInterfaceCompliance(ProductClass, type);
        this.registry[type] = ProductClass;
    }

    create(type, ...args) {
        if (!this.registry[type]) {
            throw new Error(`Unknown product type: ${type}`);
        }
        if (!this.singletons[type]) {
            this.singletons[type] = this.registry[type].getInstance(...args);
        }
        return this.singletons[type];
    }

    async createAsync(type, ...args) {
        if (!this.registry[type]) {
            throw new Error(`Unknown product type: ${type}`);
        }
        if (!this.singletons[type]) {
            if (typeof this.registry[type].getInstanceAsync === 'function') {
                this.singletons[type] = await this.registry[type].getInstanceAsync(...args);
            } else {
                this.singletons[type] = this.registry[type].getInstance(...args);
            }
        }
        return this.singletons[type];
    }
}

class ProductA extends ProductInterface {
    constructor() {
        super();
        this.name = 'ProductA';
        this.price = 100;
        this.description = 'ProductA description';
    }
    operation() {
        console.log('ProductA operation');
    }
    getName() {
        return this.name;
    }
    getPrice() {
        return this.price;
    }
    getDescription() {
        return this.description;
    }
    static getInstance() {
        if (!ProductA._instance) {
            ProductA._instance = new ProductA();
        }
        return ProductA._instance;
    }
}
class ProductC extends ProductInterface {
    constructor() {
        super();
        this.name = 'ProductC';
        this.price = 300;
        this.description = 'ProductC description';
    }
    operation() {
        console.log('ProductC operation');
    }
    getName() {
        return this.name;
    }
    getPrice() {
        return this.price;
    }
    getDescription() {
        return this.description;
    }
    static async getInstanceAsync() {
        if (!ProductC._instance) {
            // Simulate async setup
            await new Promise(res => setTimeout(res, 100));
            ProductC._instance = new ProductC();
        }
        return ProductC._instance;
    }
    static getInstance() {
        if (!ProductC._instance) {
            ProductC._instance = new ProductC();
        }
        return ProductC._instance;
    }
}

class ProductB extends ProductInterface {
    constructor() {
        super();
        this.name = 'ProductB';
        this.price = 200;
        this.description = 'ProductB description';
    }
    operation() {
        console.log('ProductB operation');
    }
    getName() {
        return this.name;
    }
    getPrice() {
        return this.price;
    }
    getDescription() {
        return this.description;
    }
    static getInstance() {
        if (!ProductB._instance) {
            ProductB._instance = new ProductB();
        }
        return ProductB._instance;
    }
}

// Usage Example
async function exampleUsage() {
    const factory = new Factory();
    // Register ProductC dynamically
    factory.register('ProductC', ProductC);

    const a = factory.create('ProductA');
    const b = factory.create('ProductB');
    const c = await factory.createAsync('ProductC');

    console.log(a.getName(), a.getPrice(), a.getDescription());
    a.operation();
    console.log(b.getName(), b.getPrice(), b.getDescription());
    b.operation();
    console.log(c.getName(), c.getPrice(), c.getDescription());
    c.operation();

    // Error handling example
    try {
        factory.create('UnknownType');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

exampleUsage();