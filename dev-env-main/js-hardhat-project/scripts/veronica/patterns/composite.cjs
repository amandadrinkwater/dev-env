/* 

Key Features:
Component Interface: Defines common operations for both leaves and composites

Leaf Class: Represents individual objects that have no children

Composite Class: Represents objects that can contain other components

Hierarchical Structure: Can build complex tree-like structures

Uniform Treatment: Clients can treat individual objects and compositions uniformly

Common Use Cases:
File systems (files and directories)

Organizational charts (employees and departments)

GUI components (simple widgets and containers)

Product structures (parts and assemblies)

The pattern allows you to build complex tree structures while treating individual objects and compositions uniformly!

Key Real-World Features:
Inventory Management: Track stock levels across individual products and bundles

Pricing Logic: Automatic price calculation for bundles with discounts

Stock Validation: Bundle availability based on lowest stock component

Search Capabilities: Find products by SKU throughout the hierarchy

Business Analytics: Total inventory value, low stock alerts

Category Management: Organize products into logical groups

Order Fulfillment: Check if bundles can be fulfilled with current stock

This implementation is ready for integration into a real e-commerce system with proper inventory management, pricing strategies, and product organization!

*/

/// Component interface for all products
class ProductComponent {
  constructor(name, sku, price) {
    this.name = name;
    this.sku = sku;
    this.price = price;
  }

  // Common operations
  getPrice() {
    return this.price;
  }

  getDescription() {
    throw new Error("Method 'getDescription()' must be implemented");
  }

  add(product) {
    throw new Error("Method 'add()' must be implemented");
  }

  remove(product) {
    throw new Error("Method 'remove()' must be implemented");
  }

  getChildren() {
    throw new Error("Method 'getChildren()' must be implemented");
  }

  // Inventory management
  getStock() {
    throw new Error("Method 'getStock()' must be implemented");
  }

  setStock(quantity) {
    throw new Error("Method 'setStock()' must be implemented");
  }

  // Display hierarchy
  display(indent = 0) {
    throw new Error("Method 'display()' must be implemented");
  }
}

// Base Product class with common functionality
class BaseProduct extends ProductComponent {
  constructor(name, sku, price, stock = 0) {
    super(name, sku, price);
    this.stock = stock;
  }

  getStock() {
    return this.stock;
  }

  setStock(quantity) {
    if (quantity >= 0) {
      this.stock = quantity;
      return true;
    }
    return false;
  }

  add(product) {
    console.log(`Cannot add product to individual product: ${this.name}`);
    return false;
  }

  remove(product) {
    console.log(`Cannot remove product from individual product: ${this.name}`);
    return false;
  }

  getChildren() {
    return [];
  }

  display(indent = 0) {
    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}📦 ${this.name} - $${this.price} (Stock: ${this.stock})`);
  }
}

// Specialized Leaf Classes
class Smartphone extends BaseProduct {
  constructor(name, sku, price, stock = 0, specs = {}) {
    super(name, sku, price, stock);
    this.type = 'Smartphone';
    this.specs = {
      storage: specs.storage || '128GB',
      ram: specs.ram || '8GB',
      screenSize: specs.screenSize || '6.1"',
      os: specs.os || 'iOS/Android',
      ...specs
    };
  }

  getDescription() {
    return `📱 ${this.name} (${this.specs.storage}, ${this.specs.ram}) - $${this.price} - Stock: ${this.stock}`;
  }

  getTechSpecs() {
    return {
      ...this.specs,
      type: this.type
    };
  }

  display(indent = 0) {
    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}📱 ${this.name} - $${this.price} (${this.specs.storage}, ${this.specs.ram}) - Stock: ${this.stock}`);
  }
}

class Headphones extends BaseProduct {
  constructor(name, sku, price, stock = 0, specs = {}) {
    super(name, sku, price, stock);
    this.type = 'Headphones';
    this.specs = {
      batteryLife: specs.batteryLife || '24h',
      connectivity: specs.connectivity || 'Wireless',
      noiseCancellation: specs.noiseCancellation || true,
      ...specs
    };
  }

  getDescription() {
    const noiseCancel = this.specs.noiseCancellation ? 'with Noise Cancellation' : '';
    return `🎧 ${this.name} (${this.specs.connectivity}) ${noiseCancel} - $${this.price} - Stock: ${this.stock}`;
  }

  getAudioFeatures() {
    return {
      ...this.specs,
      type: this.type
    };
  }

  display(indent = 0) {
    const indentStr = '  '.repeat(indent);
    const noiseCancel = this.specs.noiseCancellation ? '🎧' : '🔊';
    console.log(`${indentStr}${noiseCancel} ${this.name} - $${this.price} (${this.specs.batteryLife} battery) - Stock: ${this.stock}`);
  }
}

class SmartWatch extends BaseProduct {
  constructor(name, sku, price, stock = 0, specs = {}) {
    super(name, sku, price, stock);
    this.type = 'SmartWatch';
    this.specs = {
      screenSize: specs.screenSize || '1.9"',
      batteryLife: specs.batteryLife || '18h',
      healthFeatures: specs.healthFeatures || ['Heart Rate', 'Step Counter'],
      waterResistant: specs.waterResistant || true,
      ...specs
    };
  }

  getDescription() {
    const waterResistant = this.specs.waterResistant ? '💧 Water Resistant' : '';
    return `⌚ ${this.name} (${this.specs.screenSize} screen) - $${this.price} - ${waterResistant} - Stock: ${this.stock}`;
  }

  getHealthFeatures() {
    return this.specs.healthFeatures;
  }

  display(indent = 0) {
    const indentStr = '  '.repeat(indent);
    const waterIcon = this.specs.waterResistant ? '💧' : '';
    console.log(`${indentStr}⌚ ${this.name} - $${this.price} (${this.specs.batteryLife} battery)${waterIcon} - Stock: ${this.stock}`);
  }
}

class Laptop extends BaseProduct {
  constructor(name, sku, price, stock = 0, specs = {}) {
    super(name, sku, price, stock);
    this.type = 'Laptop';
    this.specs = {
      processor: specs.processor || 'Intel i5',
      ram: specs.ram || '16GB',
      storage: specs.storage || '512GB SSD',
      screenSize: specs.screenSize || '15.6"',
      ...specs
    };
  }

  getDescription() {
    return `💻 ${this.name} (${this.specs.processor}, ${this.specs.ram}) - $${this.price} - Stock: ${this.stock}`;
  }

  getPerformanceSpecs() {
    return {
      ...this.specs,
      type: this.type
    };
  }

  display(indent = 0) {
    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}💻 ${this.name} - $${this.price} (${this.specs.processor}) - Stock: ${this.stock}`);
  }
}

class Accessory extends BaseProduct {
  constructor(name, sku, price, stock = 0, category = 'General') {
    super(name, sku, price, stock);
    this.type = 'Accessory';
    this.category = category;
  }

  getDescription() {
    return `🔧 ${this.name} (${this.category}) - $${this.price} - Stock: ${this.stock}`;
  }

  display(indent = 0) {
    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}🔧 ${this.name} - $${this.price} (${this.category}) - Stock: ${this.stock}`);
  }
}

// Composite class - Product Bundle (Kit, Set, or Package)
class ProductBundle extends ProductComponent {
  constructor(name, sku, discount = 0) {
    super(name, sku, 0);
    this.discount = discount;
    this.children = [];
  }

  getPrice() {
    const total = this.children.reduce((sum, child) => sum + child.getPrice(), 0);
    return total * (1 - this.discount / 100);
  }

  getDescription() {
    const childDescriptions = this.children.map(child => child.getDescription());
    return `🎁 Bundle: ${this.name} - Total: $${this.getPrice().toFixed(2)} ${this.discount > 0 ? `(${this.discount}% discount)` : ''}\nIncludes:\n${childDescriptions.map(desc => `  - ${desc}`).join('\n')}`;
  }

  getStock() {
    if (this.children.length === 0) return 0;
    return Math.min(...this.children.map(child => child.getStock()));
  }

  setStock(quantity) {
    console.log(`Cannot set stock directly on bundle. Set stock on individual products.`);
    return false;
  }

  add(product) {
    if (product instanceof ProductComponent) {
      this.children.push(product);
      return true;
    }
    return false;
  }

  remove(product) {
    const index = this.children.indexOf(product);
    if (index > -1) {
      this.children.splice(index, 1);
      return true;
    }
    return false;
  }

  getChildren() {
    return this.children.slice();
  }

  getDiscount() {
    return this.discount;
  }

  setDiscount(discount) {
    this.discount = Math.max(0, Math.min(100, discount));
  }

  getBundleSavings() {
    const originalTotal = this.children.reduce((sum, child) => sum + child.getPrice(), 0);
    return originalTotal - this.getPrice();
  }

  display(indent = 0) {
    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}🎁 ${this.name} - $${this.getPrice().toFixed(2)} ${this.discount > 0 ? `(${this.discount}% discount)` : ''} - Available: ${this.getStock()}`);
    
    this.children.forEach(child => {
      child.display(indent + 1);
    });
  }

  canFulfillOrder(quantity = 1) {
    return this.getStock() >= quantity;
  }

  // Bundle-specific: Get products by type
  getProductsByType(type) {
    return this.children.filter(child => child.type === type);
  }
}

// Composite class - Product Category
class ProductCategory extends ProductComponent {
  constructor(name, description) {
    super(name, 'CAT_' + Date.now(), 0);
    this.description = description;
    this.children = [];
  }

  getPrice() {
    return 0;
  }

  getDescription() {
    return `📂 Category: ${this.name} - ${this.description} (${this.children.length} items)`;
  }

  getStock() {
    return this.children.reduce((sum, child) => sum + child.getStock(), 0);
  }

  setStock(quantity) {
    console.log(`Cannot set stock directly on category.`);
    return false;
  }

  add(product) {
    if (product instanceof ProductComponent) {
      this.children.push(product);
      return true;
    }
    return false;
  }

  remove(product) {
    const index = this.children.indexOf(product);
    if (index > -1) {
      this.children.splice(index, 1);
      return true;
    }
    return false;
  }

  getChildren() {
    return this.children.slice();
  }

  display(indent = 0) {
    const indentStr = '  '.repeat(indent);
    console.log(`${indentStr}📂 ${this.name} - ${this.description}`);
    
    this.children.forEach(child => {
      child.display(indent + 1);
    });
  }

  // Category-specific methods
  getProductsByType(type) {
    const results = [];
    this._findProductsByType(this, type, results);
    return results;
  }

  _findProductsByType(component, type, results) {
    if (component.type === type) {
      results.push(component);
    }

    if (component.getChildren && component.getChildren().length > 0) {
      component.getChildren().forEach(child => {
        this._findProductsByType(child, type, results);
      });
    }
  }

  getProductsOnSale(minDiscount = 10) {
    return this.children.filter(child => {
      if (child instanceof ProductBundle) {
        return child.getDiscount() >= minDiscount;
      }
      return false;
    });
  }

  getLowStockProducts(threshold = 5) {
    return this.children.filter(child => child.getStock() <= threshold);
  }
}

// Enhanced Inventory Manager
class InventoryManager {
  constructor() {
    this.categories = [];
  }

  addCategory(category) {
    this.categories.push(category);
  }

  findProductBySKU(sku) {
    for (const category of this.categories) {
      const result = this._searchInComponent(category, sku);
      if (result) return result;
    }
    return null;
  }

  _searchInComponent(component, sku) {
    if (component.sku === sku) {
      return component;
    }

    if (component.getChildren && component.getChildren().length > 0) {
      for (const child of component.getChildren()) {
        const result = this._searchInComponent(child, sku);
        if (result) return result;
      }
    }

    return null;
  }

  getTotalInventoryValue() {
    return this.categories.reduce((total, category) => {
      return total + this._getCategoryValue(category);
    }, 0);
  }

  _getCategoryValue(component) {
    if (component instanceof BaseProduct) {
      return component.getPrice() * component.getStock();
    }

    if (component.getChildren && component.getChildren().length > 0) {
      return component.getChildren().reduce((sum, child) => {
        return sum + this._getCategoryValue(child);
      }, 0);
    }

    return 0;
  }

  // New: Get all products of a specific type
  getProductsByType(type) {
    const results = [];
    this.categories.forEach(category => {
      results.push(...category.getProductsByType(type));
    });
    return results;
  }

  // New: Get inventory summary by product type
  getInventorySummary() {
    const summary = {};
    
    this.categories.forEach(category => {
      this._summarizeCategory(category, summary);
    });

    return summary;
  }

  _summarizeCategory(component, summary) {
    if (component instanceof BaseProduct) {
      const type = component.type;
      if (!summary[type]) {
        summary[type] = { count: 0, totalValue: 0, items: [] };
      }
      summary[type].count++;
      summary[type].totalValue += component.getPrice() * component.getStock();
      summary[type].items.push(component.name);
    }

    if (component.getChildren && component.getChildren().length > 0) {
      component.getChildren().forEach(child => {
        this._summarizeCategory(child, summary);
      });
    }
  }

  displayInventory() {
    console.log('🏬 INVENTORY OVERVIEW 🏬\n');
    this.categories.forEach(category => {
      category.display();
      console.log('');
    });
    
    console.log(`Total Inventory Value: $${this.getTotalInventoryValue().toFixed(2)}`);
    
    // Display summary by type
    const summary = this.getInventorySummary();
    console.log('\n📊 INVENTORY SUMMARY BY TYPE:');
    Object.keys(summary).forEach(type => {
      console.log(`  ${type}: ${summary[type].count} items - Value: $${summary[type].totalValue.toFixed(2)}`);
    });
  }
}

// Example usage with specialized classes
function demonstrateEcommerceSystem() {
  console.log('=== ENHANCED E-COMMERCE PRODUCT SYSTEM ===\n');

  // Create specialized products
  const iPhone = new Smartphone(
    'iPhone 15 Pro', 
    'IP15PRO', 
    999, 
    50,
    { storage: '256GB', ram: '8GB', screenSize: '6.1"', os: 'iOS 17' }
  );

  const airpods = new Headphones(
    'AirPods Pro', 
    'AIRPODSPRO', 
    249, 
    100,
    { batteryLife: '30h', connectivity: 'Wireless', noiseCancellation: true }
  );

  const appleWatch = new SmartWatch(
    'Apple Watch Series 9', 
    'AWS9', 
    399, 
    30,
    { screenSize: '1.9"', batteryLife: '18h', healthFeatures: ['Heart Rate', 'ECG', 'Sleep Tracking'], waterResistant: true }
  );

  const macbook = new Laptop(
    'MacBook Pro 16"', 
    'MBP16', 
    2399, 
    15,
    { processor: 'M3 Pro', ram: '36GB', storage: '1TB SSD', screenSize: '16.2"' }
  );

  const chargingCable = new Accessory('USB-C Cable', 'USBC01', 29, 200, 'Charging');

  // Create product bundles
  const appleBundle = new ProductBundle('Apple Ecosystem Bundle', 'APPLEBUNDLE', 15);
  appleBundle.add(iPhone);
  appleBundle.add(airpods);
  appleBundle.add(appleWatch);

  const proBundle = new ProductBundle('Pro Setup Bundle', 'PROBUNDLE', 12);
  proBundle.add(macbook);
  proBundle.add(appleWatch);
  proBundle.add(chargingCable);

  // Create categories
  const electronics = new ProductCategory('Electronics', 'All electronic devices');
  const appleProducts = new ProductCategory('Apple Products', 'Genuine Apple devices');
  const bundles = new ProductCategory('Bundles', 'Special product bundles');

  // Build category structure
  appleProducts.add(iPhone);
  appleProducts.add(airpods);
  appleProducts.add(appleWatch);
  appleProducts.add(macbook);

  electronics.add(appleProducts);
  electronics.add(chargingCable);

  bundles.add(appleBundle);
  bundles.add(proBundle);

  // Create inventory manager
  const inventoryManager = new InventoryManager();
  inventoryManager.addCategory(electronics);
  inventoryManager.addCategory(bundles);

  // Display entire inventory
  inventoryManager.displayInventory();

  // Demonstrate specialized functionality
  console.log('\n=== SPECIALIZED FEATURES ===');
  console.log('Smartphone Tech Specs:', iPhone.getTechSpecs());
  console.log('Headphone Features:', airpods.getAudioFeatures());
  console.log('Watch Health Features:', appleWatch.getHealthFeatures());
  console.log('Laptop Performance:', macbook.getPerformanceSpecs());

  // Get products by type
  const smartphones = inventoryManager.getProductsByType('Smartphone');
  console.log(`\nSmartphones in inventory: ${smartphones.length}`);

  // Bundle type analysis
  const headphonesInBundle = appleBundle.getProductsByType('Headphones');
  console.log(`Headphones in Apple bundle: ${headphonesInBundle.length}`);
}

module.exports = {
  ProductComponent,
  BaseProduct,
  Smartphone,
  Headphones,
  SmartWatch,
  Laptop,
  Accessory,
  ProductBundle,
  ProductCategory,
  InventoryManager,
  demonstrateEcommerceSystem
};

if (require.main === module) {
  demonstrateEcommerceSystem();
}