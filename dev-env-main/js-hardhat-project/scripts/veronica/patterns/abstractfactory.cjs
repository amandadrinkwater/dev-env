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
    create(type) {
        let product;
        if (type === 'ProductA') {
            product = new this.registry[type]();
        } else if (type === 'ProductB') {
            product = new this.registry[type]();
        }
        return product;
    }

    
    constructor() {
        this.registry = {};
        // Register default products
        this.register('ProductA', ProductA);
        this.register('ProductB', ProductB);
    }

    register(type, ProductClass) {
        ProductInterface.testProductInterfaceCompliance(ProductClass, type);
        this.registry[type] = ProductClass;
    }

    create(type, ...args) {
        const ProductClass = this.registry[type];
        if (!ProductClass) {
            throw new Error(`Unknown product type: ${type}`);
        }
        return new ProductClass(...args);
    }

    async createAsync(type, ...args) {
        const ProductClass = this.registry[type];
        if (!ProductClass) {
            throw new Error(`Unknown product type: ${type}`);
        }
        if (typeof ProductClass.createAsync === 'function') {
            return await ProductClass.createAsync(...args);
        }
        // fallback to sync creation
        return new ProductClass(...args);
    }

      
}

class ProductA extends ProductInterface {
  constructor() {
      this.name = 'ProductA';
      this.price = 100;
      this.description = 'ProductA description'
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

    getDescription()   {
        return this.description;
    }
}    
class ProductC extends ProductInterface {
    constructor() {
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
    // Example async creation
    static async createAsync() {
        // Simulate async setup
        await new Promise(res => setTimeout(res, 100));
        return new ProductC();
    }
}

class ProductB extends ProductInterface {
    operation() {
        console.log('ProductB operation');
    }

   getName() {
        return 'ProductB';
   } 

   getPrice() {
        return 200;
   }

    getDescription() {
        return 'ProductB description';
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