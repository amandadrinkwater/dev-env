
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

class ProductA {
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
class ProductC {
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

class ProductB {
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