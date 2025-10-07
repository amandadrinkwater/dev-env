/* What is the Facade Pattern?
The Facade Pattern provides a simplified interface to a complex subsystem, hiding its complexity from the client.

Real-World Use Cases
Library/Framework Wrappers - jQuery's $(selector) hides complex DOM manipulation

Payment Gateways - Single interface for multiple payment processors

Database ORMs - Simplified interface for complex database operations

UI Component Libraries - Hide browser compatibility issues

Microservices Gateways - Single entry point for multiple services

Benefits
Simplifies complex systems

Reduces dependencies - clients only depend on facade

Improves readability and maintainability

Easy to swap underlying implementations

The Facade Pattern is perfect for when you want to provide a clean, simple interface to a complex system while keeping the complex parts organized and maintainable behind the scenes.

These complex examples demonstrate how the Facade Pattern can orchestrate multiple sophisticated subsystems, providing:

Transaction management with rollback capabilities

Intelligent caching strategies

Parallel service calls with error handling

Complex business logic encapsulation

Personalization algorithms

Batch processing capabilities

Comprehensive error handling and recovery

The facades hide enormous complexity while providing simple, clean interfaces for the clients.



*/

// 1. Basic Example: Home Theater System

// Complex subsystem classes
class Amplifier {
  turnOn() {
    console.log('Amplifier turned on');
  }
  
  setVolume(level) {
    console.log(`Volume set to ${level}`);
  }
  
  setSource(source) {
    console.log(`Source set to ${source}`);
  }
}

class BluRayPlayer {
  turnOn() {
    console.log('Blu-ray player turned on');
  }
  
  play(movie) {
    console.log(`Playing movie: ${movie}`);
  }
}

class Projector {
  turnOn() {
    console.log('Projector turned on');
  }
  
  setInput(source) {
    console.log(`Projector input set to ${source}`);
  }
  
  setWideScreenMode() {
    console.log('Widescreen mode enabled');
  }
}

class Lights {
  dim(level) {
    console.log(`Lights dimmed to ${level}%`);
  }
}

// Facade - Simplified interface
class HomeTheaterFacade {
  constructor(amplifier, player, projector, lights) {
    this.amplifier = amplifier;
    this.player = player;
    this.projector = projector;
    this.lights = lights;
  }

  watchMovie(movie) {
    console.log('🎬 Getting ready to watch a movie...');
    
    this.lights.dim(10);
    this.amplifier.turnOn();
    this.amplifier.setVolume(5);
    this.amplifier.setSource('blu-ray');
    this.projector.turnOn();
    this.projector.setInput('blu-ray');
    this.projector.setWideScreenMode();
    this.player.turnOn();
    this.player.play(movie);
    
    console.log('🎬 Movie theater ready!');
  }

  endMovie() {
    console.log('🛑 Shutting down home theater...');
    
    this.player.turnOff();
    this.projector.turnOff();
    this.amplifier.turnOff();
    this.lights.dim(100);
    
    console.log('✅ Home theater shutdown complete');
  }
}

// Usage
const amplifier = new Amplifier();
const player = new BluRayPlayer();
const projector = new Projector();
const lights = new Lights();

const homeTheater = new HomeTheaterFacade(amplifier, player, projector, lights);

// Simple interface for complex operations
homeTheater.watchMovie('Inception');
// homeTheater.endMovie();

// 2. Real-World Example: API Client Facade

// Complex HTTP operations
class HttpClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

class AuthService {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  async login(email, password) {
    return this.httpClient.request('POST', '/auth/login', { email, password });
  }

  async refreshToken(refreshToken) {
    return this.httpClient.request('POST', '/auth/refresh', { refreshToken });
  }
}

class UserService {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  async getProfile() {
    return this.httpClient.request('GET', '/users/profile');
  }

  async updateProfile(userData) {
    return this.httpClient.request('PUT', '/users/profile', userData);
  }
}

class ProductService {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  async getProducts(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.httpClient.request('GET', `/products?${queryString}`);
  }

  async getProduct(id) {
    return this.httpClient.request('GET', `/products/${id}`);
  }
}

// Facade - Simplified API client
class ApiClientFacade {
  constructor(baseURL) {
    const httpClient = new HttpClient(baseURL);
    this.auth = new AuthService(httpClient);
    this.users = new UserService(httpClient);
    this.products = new ProductService(httpClient);
  }

  // Simplified authentication
  async signIn(email, password) {
    try {
      const result = await this.auth.login(email, password);
      // Store tokens, set headers, etc.
      console.log('Successfully signed in');
      return result;
    } catch (error) {
      console.error('Sign in failed:', error.message);
      throw error;
    }
  }

  // Simplified product browsing with user context
  async browseProducts(category = null, search = '') {
    try {
      const filters = {};
      if (category) filters.category = category;
      if (search) filters.search = search;

      const [products, userProfile] = await Promise.all([
        this.products.getProducts(filters),
        this.users.getProfile()
      ]);

      return {
        products,
        userPreferences: userProfile.preferences,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to browse products:', error.message);
      throw error;
    }
  }

  // Complete user shopping experience
  async shopForUser(email, password, category) {
    try {
      // Authenticate
      await this.signIn(email, password);
      
      // Browse products
      const shoppingData = await this.browseProducts(category);
      
      // Update user preferences based on browsing
      await this.users.updateProfile({
        lastBrowsedCategory: category,
        lastActive: new Date().toISOString()
      });

      return shoppingData;
    } catch (error) {
      console.error('Shopping experience failed:', error.message);
      throw error;
    }
  }
}

// Usage
async function demonstrateApiFacade() {
  const api = new ApiClientFacade('https://api.example.com');

  try {
    // Simple interface for complex operations
    const shoppingResult = await api.shopForUser('user@example.com', 'password', 'electronics');
    console.log('Shopping result:', shoppingResult);
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// demonstrateApiFacade();

// 3. Browser Compatibility Facade

// Complex browser-specific implementations
class LocalStorageManager {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('LocalStorage failed, falling back to in-memory storage');
      return false;
    }
  }

  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('LocalStorage read failed');
      return null;
    }
  }
}

class IndexedDBManager {
  constructor() {
    this.dbName = 'AppDatabase';
    this.version = 1;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' });
        }
      };
    });
  }

  async save(key, data) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.put({ key, data });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async load(key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ? request.result.data : null);
    });
  }
}

class MemoryStorage {
  constructor() {
    this.storage = new Map();
  }

  save(key, data) {
    this.storage.set(key, data);
    return true;
  }

  load(key) {
    return this.storage.get(key) || null;
  }
}

// Facade - Unified storage interface
class StorageFacade {
  constructor() {
    this.storageEngines = [
      new LocalStorageManager(),
      new IndexedDBManager(),
      new MemoryStorage()
    ];
    
    this.currentEngine = this.determineBestEngine();
  }

  determineBestEngine() {
    // Try engines in order of preference
    for (const engine of this.storageEngines) {
      if (engine instanceof LocalStorageManager) {
        // Test localStorage
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          console.log('Using LocalStorage');
          return engine;
        } catch (e) {
          continue;
        }
      }
      
      if (engine instanceof IndexedDBManager) {
        // Test IndexedDB availability
        if ('indexedDB' in window) {
          console.log('Using IndexedDB');
          return engine;
        }
      }
    }
    
    console.log('Using MemoryStorage as fallback');
    return this.storageEngines[2]; // MemoryStorage
  }

  async save(key, data) {
    try {
      if (this.currentEngine.save.constructor.name === 'AsyncFunction') {
        return await this.currentEngine.save(key, data);
      } else {
        return this.currentEngine.save(key, data);
      }
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }

  async load(key) {
    try {
      if (this.currentEngine.load.constructor.name === 'AsyncFunction') {
        return await this.currentEngine.load(key);
      } else {
        return this.currentEngine.load(key);
      }
    } catch (error) {
      console.error('Load failed:', error);
      return null;
    }
  }
}

// Usage
async function demonstrateStorageFacade() {
  const storage = new StorageFacade();
  
  // Simple interface that works across all browsers
  await storage.save('userSettings', { theme: 'dark', language: 'en' });
  const settings = await storage.load('userSettings');
  console.log('Loaded settings:', settings);
}

// demonstrateStorageFacade();


// Complex Facade Pattern Examples
// 1. Advanced E-commerce Order Processing System

// Complex Subsystem Classes
class InventoryService {
  constructor() {
    this.products = new Map([
      ['PROD-001', { id: 'PROD-001', name: 'Laptop', price: 999.99, stock: 50, weight: 2.5 }],
      ['PROD-002', { id: 'PROD-002', name: 'Mouse', price: 29.99, stock: 200, weight: 0.2 }],
      ['PROD-003', { id: 'PROD-003', name: 'Keyboard', price: 79.99, stock: 150, weight: 0.8 }]
    ]);
  }

  async checkAvailability(productId, quantity) {
    await this.simulateNetworkDelay();
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    return {
      available: product.stock >= quantity,
      currentStock: product.stock,
      product: { ...product }
    };
  }

  async reserveItems(productId, quantity) {
    await this.simulateNetworkDelay();
    const product = this.products.get(productId);
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock for ${productId}`);
    }
    product.stock -= quantity;
    return { reserved: quantity, remainingStock: product.stock };
  }

  async releaseItems(productId, quantity) {
    await this.simulateNetworkDelay();
    const product = this.products.get(productId);
    product.stock += quantity;
    return { released: quantity, newStock: product.stock };
  }

  simulateNetworkDelay() {
    return new Promise(resolve => setTimeout(resolve, 100));
  }
}

class PricingEngine {
  constructor() {
    this.taxRates = new Map([
      ['US', 0.08],
      ['EU', 0.21],
      ['UK', 0.20],
      ['CA', 0.05]
    ]);
    
    this.discountRules = {
      bulk: { threshold: 10, percentage: 0.1 },
      seasonal: { code: 'SUMMER2024', percentage: 0.15 },
      loyalty: { tiers: { bronze: 0.02, silver: 0.05, gold: 0.1 } }
    };
  }

  calculateSubtotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  applyDiscounts(subtotal, discountCode, userTier, totalQuantity) {
    let discountedTotal = subtotal;
    let appliedDiscounts = [];

    // Bulk discount
    if (totalQuantity >= this.discountRules.bulk.threshold) {
      const discount = discountedTotal * this.discountRules.bulk.percentage;
      discountedTotal -= discount;
      appliedDiscounts.push({ type: 'bulk', amount: discount, percentage: this.discountRules.bulk.percentage });
    }

    // Seasonal discount
    if (discountCode === this.discountRules.seasonal.code) {
      const discount = discountedTotal * this.discountRules.seasonal.percentage;
      discountedTotal -= discount;
      appliedDiscounts.push({ type: 'seasonal', amount: discount, percentage: this.discountRules.seasonal.percentage });
    }

    // Loyalty discount
    if (userTier && this.discountRules.loyalty.tiers[userTier]) {
      const discount = discountedTotal * this.discountRules.loyalty.tiers[userTier];
      discountedTotal -= discount;
      appliedDiscounts.push({ type: 'loyalty', amount: discount, percentage: this.discountRules.loyalty.tiers[userTier] });
    }

    return { discountedTotal, appliedDiscounts };
  }

  calculateTax(amount, country) {
    const taxRate = this.taxRates.get(country) || 0;
    const taxAmount = amount * taxRate;
    return { taxAmount, taxRate, totalWithTax: amount + taxAmount };
  }

  async generatePriceBreakdown(items, country, discountCode = null, userTier = null) {
    await this.simulateCalculationDelay();
    
    const subtotal = this.calculateSubtotal(items);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    const { discountedTotal, appliedDiscounts } = this.applyDiscounts(
      subtotal, discountCode, userTier, totalQuantity
    );
    
    const { taxAmount, taxRate, totalWithTax } = this.calculateTax(discountedTotal, country);

    return {
      subtotal,
      discounts: appliedDiscounts,
      discountTotal: subtotal - discountedTotal,
      tax: { rate: taxRate, amount: taxAmount },
      total: totalWithTax,
      currency: 'USD'
    };
  }

  simulateCalculationDelay() {
    return new Promise(resolve => setTimeout(resolve, 150));
  }
}

class ShippingService {
  constructor() {
    this.carriers = [
      { name: 'Standard', baseCost: 5.99, perKg: 1.5, days: 5 },
      { name: 'Express', baseCost: 12.99, perKg: 3.0, days: 2 },
      { name: 'Overnight', baseCost: 24.99, perKg: 6.0, days: 1 }
    ];
  }

  async calculateShippingOptions(items, destination, urgent = false) {
    await this.simulateShippingCalculation();
    
    const totalWeight = items.reduce((weight, item) => 
      weight + (item.product.weight * item.quantity), 0
    );

    const options = this.carriers.map(carrier => {
      const shippingCost = carrier.baseCost + (totalWeight * carrier.perKg);
      const estimatedDays = urgent ? Math.max(1, carrier.days - 1) : carrier.days;
      const deliveryDate = this.calculateDeliveryDate(estimatedDays);
      
      return {
        carrier: carrier.name,
        cost: shippingCost,
        estimatedDays,
        deliveryDate,
        urgent: urgent && carrier.name !== 'Standard'
      };
    });

    return options.sort((a, b) => a.cost - b.cost);
  }

  async schedulePickup(orderId, shippingOption, packages) {
    await this.simulateScheduling();
    
    const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    
    return {
      orderId,
      trackingNumber,
      carrier: shippingOption.carrier,
      scheduledPickup: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      estimatedDelivery: shippingOption.deliveryDate,
      packages: packages.map(pkg => ({
        ...pkg,
        trackingUrl: `https://tracking.com/${trackingNumber}`
      }))
    };
  }

  calculateDeliveryDate(businessDays) {
    const date = new Date();
    let daysAdded = 0;
    
    while (daysAdded < businessDays) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        daysAdded++;
      }
    }
    
    return date;
  }

  simulateShippingCalculation() {
    return new Promise(resolve => setTimeout(resolve, 200));
  }

  simulateScheduling() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

class PaymentProcessor {
  constructor() {
    this.providers = ['stripe', 'paypal', 'square'];
  }

  async validatePaymentMethod(paymentMethod, amount) {
    await this.simulateValidation();
    
    // Simulate various validation checks
    const checks = {
      cardNumber: this.validateCardNumber(paymentMethod.cardNumber),
      expiry: this.validateExpiry(paymentMethod.expiryMonth, paymentMethod.expiryYear),
      cvv: this.validateCVV(paymentMethod.cvv),
      balance: await this.checkBalance(paymentMethod, amount)
    };

    const isValid = Object.values(checks).every(check => check.valid);
    
    return {
      isValid,
      checks,
      provider: this.selectProvider(paymentMethod.type)
    };
  }

  async processPayment(paymentMethod, amount, currency = 'USD') {
    await this.simulatePaymentProcessing();
    
    const validation = await this.validatePaymentMethod(paymentMethod, amount);
    
    if (!validation.isValid) {
      throw new Error(`Payment validation failed: ${JSON.stringify(validation.checks)}`);
    }

    // Simulate payment processing
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
    const fee = this.calculateProcessingFee(amount, validation.provider);

    return {
      transactionId,
      amount,
      currency,
      processingFee: fee,
      netAmount: amount - fee,
      provider: validation.provider,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  }

  async refundPayment(transactionId, amount) {
    await this.simulateRefund();
    
    return {
      refundId: `REF${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase(),
      originalTransactionId: transactionId,
      amount,
      status: 'processed',
      timestamp: new Date().toISOString()
    };
  }

  validateCardNumber(cardNumber) {
    // Simple Luhn algorithm check
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    return { valid: sum % 10 === 0, reason: sum % 10 === 0 ? null : 'Invalid card number' };
  }

  validateExpiry(month, year) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const isValid = (year > currentYear) || (year === currentYear && month >= currentMonth);
    return { valid: isValid, reason: isValid ? null : 'Card expired' };
  }

  validateCVV(cvv) {
    const isValid = /^\d{3,4}$/.test(cvv);
    return { valid: isValid, reason: isValid ? null : 'Invalid CVV' };
  }

  async checkBalance(paymentMethod, amount) {
    await this.simulateBalanceCheck();
    // Simulate balance check - in reality, this would call a bank API
    const hasSufficientBalance = amount <= 10000; // Assume $10,000 limit
    return { valid: hasSufficientBalance, reason: hasSufficientBalance ? null : 'Insufficient funds' };
  }

  selectProvider(type) {
    const providers = {
      credit: 'stripe',
      debit: 'square',
      paypal: 'paypal'
    };
    return providers[type] || 'stripe';
  }

  calculateProcessingFee(amount, provider) {
    const fees = { stripe: 0.029, paypal: 0.034, square: 0.026 };
    return Math.round((amount * fees[provider] + 0.3) * 100) / 100; // $0.30 + percentage
  }

  simulateValidation() { return new Promise(resolve => setTimeout(resolve, 100)); }
  simulatePaymentProcessing() { return new Promise(resolve => setTimeout(resolve, 500)); }
  simulateRefund() { return new Promise(resolve => setTimeout(resolve, 400)); }
  simulateBalanceCheck() { return new Promise(resolve => setTimeout(resolve, 150)); }
}

class NotificationService {
  constructor() {
    this.channels = ['email', 'sms', 'push'];
  }

  async sendOrderConfirmation(order, user) {
    await this.simulateNotification();
    
    const messages = this.channels.map(channel => ({
      channel,
      recipient: this.getRecipient(channel, user),
      subject: `Order Confirmation - #${order.id}`,
      body: this.generateOrderConfirmationBody(order, user, channel),
      sentAt: new Date().toISOString(),
      status: 'sent'
    }));

    return messages;
  }

  async sendShippingNotification(trackingInfo, user) {
    await this.simulateNotification();
    
    return this.channels.map(channel => ({
      channel,
      recipient: this.getRecipient(channel, user),
      subject: 'Your order has shipped!',
      body: this.generateShippingNotificationBody(trackingInfo, channel),
      sentAt: new Date().toISOString(),
      status: 'sent'
    }));
  }

  getRecipient(channel, user) {
    const recipients = {
      email: user.email,
      sms: user.phone,
      push: user.deviceId
    };
    return recipients[channel];
  }

  generateOrderConfirmationBody(order, user, channel) {
    const templates = {
      email: `
        Dear ${user.name},
        
        Thank you for your order #${order.id}!
        
        Items: ${order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
        Total: $${order.pricing.total}
        
        Estimated delivery: ${order.shipping.deliveryDate}
        
        Thank you for shopping with us!
      `,
      sms: `Order #${order.id} confirmed! Total: $${order.pricing.total}. Delivery: ${order.shipping.deliveryDate}`,
      push: `Order confirmed! #${order.id} - $${order.pricing.total}`
    };
    return templates[channel];
  }

  generateShippingNotificationBody(trackingInfo, channel) {
    const templates = {
      email: `
        Your order has shipped!
        
        Tracking Number: ${trackingInfo.trackingNumber}
        Carrier: ${trackingInfo.carrier}
        Estimated Delivery: ${trackingInfo.estimatedDelivery}
        
        Track your package: ${trackingInfo.packages[0].trackingUrl}
      `,
      sms: `Your order shipped! Track: ${trackingInfo.trackingNumber}`,
      push: `Shipped! Track: ${trackingInfo.trackingNumber}`
    };
    return templates[channel];
  }

  simulateNotification() {
    return new Promise(resolve => setTimeout(resolve, 50));
  }
}

// FACADE: E-commerce Order Processing System
class ECommerceOrderFacade {
  constructor() {
    this.inventory = new InventoryService();
    this.pricing = new PricingEngine();
    this.shipping = new ShippingService();
    this.payment = new PaymentProcessor();
    this.notifications = new NotificationService();
    
    this.orders = new Map();
    this.orderCounter = 1000;
  }

  async createOrder(orderData) {
    const { userId, items, shippingAddress, paymentMethod, discountCode, urgentShipping } = orderData;
    
    console.log('🚀 Starting order processing...');
    
    try {
      // Step 1: Validate and reserve inventory
      const inventoryResults = await this.processInventory(items);
      
      // Step 2: Calculate pricing
      const user = await this.getUserProfile(userId);
      const pricing = await this.pricing.generatePriceBreakdown(
        inventoryResults.validatedItems,
        shippingAddress.country,
        discountCode,
        user.tier
      );
      
      // Step 3: Calculate shipping
      const shippingOptions = await this.shipping.calculateShippingOptions(
        inventoryResults.validatedItems,
        shippingAddress,
        urgentShipping
      );
      const selectedShipping = shippingOptions[0]; // Cheapest option
      
      // Step 4: Process payment (total + shipping)
      const totalAmount = pricing.total + selectedShipping.cost;
      const paymentResult = await this.payment.processPayment(paymentMethod, totalAmount);
      
      // Step 5: Create order record
      const order = await this.createOrderRecord({
        userId,
        items: inventoryResults.validatedItems,
        pricing: { ...pricing, shipping: selectedShipping.cost },
        shipping: { ...selectedShipping, address: shippingAddress },
        payment: paymentResult,
        inventoryReservations: inventoryResults.reservations
      });
      
      // Step 6: Schedule shipping
      const shippingSchedule = await this.shipping.schedulePickup(
        order.id,
        selectedShipping,
        this.createPackages(inventoryResults.validatedItems)
      );
      
      // Step 7: Send notifications
      const notifications = await this.notifications.sendOrderConfirmation(order, user);
      
      // Step 8: Update order with complete information
      order.shipping.tracking = shippingSchedule;
      order.notifications = notifications;
      order.status = 'completed';
      
      console.log('✅ Order processed successfully!');
      return order;
      
    } catch (error) {
      console.error('❌ Order processing failed:', error.message);
      
      // Rollback inventory reservations
      await this.rollbackInventory(orderData.items);
      throw error;
    }
  }

  async processInventory(items) {
    const validatedItems = [];
    const reservations = [];
    
    for (const item of items) {
      const availability = await this.inventory.checkAvailability(item.productId, item.quantity);
      
      if (!availability.available) {
        throw new Error(`Insufficient stock for ${availability.product.name}`);
      }
      
      const reservation = await this.inventory.reserveItems(item.productId, item.quantity);
      reservations.push(reservation);
      
      validatedItems.push({
        ...item,
        product: availability.product,
        price: availability.product.price
      });
    }
    
    return { validatedItems, reservations };
  }

  async createOrderRecord(orderData) {
    const orderId = `ORD${this.orderCounter++}`;
    const order = {
      id: orderId,
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'processing',
      metadata: {
        version: '1.0',
        processedBy: 'order-facade-v1'
      }
    };
    
    this.orders.set(orderId, order);
    return order;
  }

  createPackages(items) {
    // Simple packaging logic - group by product type and weight
    const packages = [];
    let currentPackage = { items: [], totalWeight: 0 };
    
    for (const item of items) {
      const itemWeight = item.product.weight * item.quantity;
      
      if (currentPackage.totalWeight + itemWeight > 10) { // Max 10kg per package
        packages.push({ ...currentPackage });
        currentPackage = { items: [], totalWeight: 0 };
      }
      
      currentPackage.items.push(item);
      currentPackage.totalWeight += itemWeight;
    }
    
    if (currentPackage.items.length > 0) {
      packages.push(currentPackage);
    }
    
    return packages.map((pkg, index) => ({
      id: `PKG${index + 1}`,
      ...pkg,
      dimensions: this.calculateDimensions(pkg.totalWeight)
    }));
  }

  calculateDimensions(weight) {
    // Simplified dimension calculation
    const baseSize = Math.cbrt(weight * 1000); // Convert kg to cm³
    return {
      length: Math.round(baseSize),
      width: Math.round(baseSize * 0.8),
      height: Math.round(baseSize * 0.6),
      weight: weight
    };
  }

  async getUserProfile(userId) {
    // Simulate user profile lookup
    return {
      id: userId,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      deviceId: 'device123',
      tier: 'gold',
      preferences: { language: 'en', currency: 'USD' }
    };
  }

  async rollbackInventory(items) {
    console.log('🔄 Rolling back inventory reservations...');
    for (const item of items) {
      try {
        await this.inventory.releaseItems(item.productId, item.quantity);
      } catch (error) {
        console.error(`Failed to release items for ${item.productId}:`, error.message);
      }
    }
  }

  async getOrderStatus(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    return {
      id: order.id,
      status: order.status,
      pricing: order.pricing,
      shipping: order.shipping,
      payment: { status: order.payment.status, transactionId: order.payment.transactionId },
      createdAt: order.createdAt
    };
  }

  async cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    if (order.status === 'shipped') {
      throw new Error('Cannot cancel shipped order');
    }
    
    // Refund payment
    const refund = await this.payment.refundPayment(order.payment.transactionId, order.payment.amount);
    
    // Release inventory
    await this.rollbackInventory(order.items);
    
    // Update order status
    order.status = 'cancelled';
    order.refund = refund;
    order.cancelledAt = new Date().toISOString();
    
    return order;
  }
}

// Usage Example
async function demonstrateECommerceFacade() {
  const ecommerce = new ECommerceOrderFacade();
  
  const orderData = {
    userId: 'user123',
    items: [
      { productId: 'PROD-001', quantity: 1 },
      { productId: 'PROD-002', quantity: 2 }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'US',
      zipCode: '10001'
    },
    paymentMethod: {
      type: 'credit',
      cardNumber: '4111111111111111',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
      holderName: 'John Doe'
    },
    discountCode: 'SUMMER2024',
    urgentShipping: true
  };
  
  try {
    const order = await ecommerce.createOrder(orderData);
    console.log('🎉 Order created successfully:', {
      id: order.id,
      total: order.pricing.total,
      status: order.status,
      tracking: order.shipping.tracking.trackingNumber
    });
    
    // Check order status
    const status = await ecommerce.getOrderStatus(order.id);
    console.log('📊 Order status:', status);
    
  } catch (error) {
    console.error('💥 Order failed:', error.message);
  }
}

// demonstrateECommerceFacade();

// 2. Microservices Orchestration Facade

// Complex Microservices
class UserService {
  async getUser(userId) {
    await this.simulateNetworkCall();
    return {
      id: userId,
      name: 'Jane Smith',
      email: 'jane@example.com',
      preferences: { theme: 'dark', notifications: true },
      membership: 'premium'
    };
  }

  async updateUserActivity(userId) {
    await this.simulateNetworkCall();
    return { updated: true, lastActive: new Date().toISOString() };
  }

  simulateNetworkCall() {
    return new Promise(resolve => setTimeout(resolve, 100));
  }
}

class ContentService {
  async getRecommendedContent(userId, preferences) {
    await this.simulateNetworkCall();
    return [
      { id: 'content1', title: 'AI Trends 2024', type: 'article', tags: ['tech', 'ai'] },
      { id: 'content2', title: 'Blockchain Revolution', type: 'video', tags: ['crypto', 'tech'] },
      { id: 'content3', title: 'Quantum Computing', type: 'podcast', tags: ['science', 'quantum'] }
    ];
  }

  async getTrendingContent() {
    await this.simulateNetworkCall();
    return [
      { id: 'trend1', title: 'Metaverse Explained', views: 15000 },
      { id: 'trend2', title: 'Web3 Basics', views: 12000 }
    ];
  }

  simulateNetworkCall() {
    return new Promise(resolve => setTimeout(resolve, 150));
  }
}

class AnalyticsService {
  async trackUserEngagement(userId, contentId, action) {
    await this.simulateNetworkCall();
    return {
      eventId: `evt_${Date.now()}`,
      userId,
      contentId,
      action,
      timestamp: new Date().toISOString(),
      processed: true
    };
  }

  async getUserAnalytics(userId) {
    await this.simulateNetworkCall();
    return {
      userId,
      totalEngagements: 142,
      favoriteCategories: ['tech', 'science'],
      averageSession: '12m',
      retentionScore: 0.85
    };
  }

  simulateNetworkCall() {
    return new Promise(resolve => setTimeout(resolve, 80));
  }
}

class NotificationService {
  async sendPersonalizedNotification(user, content, context) {
    await this.simulateNetworkCall();
    return {
      notificationId: `notif_${Date.now()}`,
      userId: user.id,
      title: `Recommended: ${content.title}`,
      message: `Based on your interests in ${context.reason}`,
      sent: true,
      channels: ['push', 'email']
    };
  }

  simulateNetworkCall() {
    return new Promise(resolve => setTimeout(resolve, 120));
  }
}

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  async get(key) {
    await this.simulateCacheAccess();
    const item = this.cache.get(key);
    const ttl = this.ttl.get(key);
    
    if (item && ttl && ttl > Date.now()) {
      return item;
    }
    
    if (item) {
      this.cache.delete(key);
      this.ttl.delete(key);
    }
    
    return null;
  }

  async set(key, value, ttlMs = 300000) { // 5 minutes default
    await this.simulateCacheAccess();
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
    return true;
  }

  async invalidate(pattern) {
    await this.simulateCacheAccess();
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
    return true;
  }

  simulateCacheAccess() {
    return new Promise(resolve => setTimeout(resolve, 10));
  }
}

// FACADE: Personalized Content Delivery System
class ContentDeliveryFacade {
  constructor() {
    this.userService = new UserService();
    this.contentService = new ContentService();
    this.analyticsService = new AnalyticsService();
    this.notificationService = new NotificationService();
    this.cacheService = new CacheService();
    
    this.config = {
      cacheTtl: 300000, // 5 minutes
      maxRecommendations: 5,
      enableNotifications: true
    };
  }

  async getUserDashboard(userId) {
    const cacheKey = `dashboard_${userId}`;
    
    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      console.log('📦 Serving from cache');
      return cached;
    }

    console.log('🔄 Building fresh dashboard...');
    
    // Parallel service calls
    const [user, recommendations, trending, analytics] = await Promise.all([
      this.userService.getUser(userId),
      this.contentService.getRecommendedContent(userId, {}),
      this.contentService.getTrendingContent(),
      this.analyticsService.getUserAnalytics(userId)
    ]);

    // Update user activity
    await this.userService.updateUserActivity(userId);

    // Process and personalize content
    const personalizedContent = this.personalizeContent(
      recommendations, 
      trending, 
      user, 
      analytics
    );

    // Send notification if enabled
    if (this.config.enableNotifications && personalizedContent.recommendations.length > 0) {
      await this.sendRecommendationNotification(user, personalizedContent.recommendations[0], analytics);
    }

    // Track engagement
    await this.analyticsService.trackUserEngagement(
      userId, 
      'dashboard_view', 
      'page_view'
    );

    const dashboard = {
      user: this.sanitizeUserData(user),
      content: personalizedContent,
      analytics: this.formatAnalytics(analytics),
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheKey,
        version: '2.1.0'
      }
    };

    // Cache the result
    await this.cacheService.set(cacheKey, dashboard, this.config.cacheTtl);

    return dashboard;
  }

  personalizeContent(recommendations, trending, user, analytics) {
    // Advanced personalization logic
    const scoredContent = recommendations.map(content => {
      let score = 0.5; // Base score
      
      // Boost score based on user preferences
      if (user.preferences.theme === 'dark') {
        score += 0.1;
      }
      
      // Boost based on user's favorite categories
      analytics.favoriteCategories.forEach(category => {
        if (content.tags.includes(category)) {
          score += 0.2;
        }
      });
      
      // Premium users get higher quality recommendations
      if (user.membership === 'premium') {
        score += 0.15;
      }
      
      return { ...content, personalizationScore: score };
    });

    // Sort by score and take top N
    const personalizedRecs = scoredContent
      .sort((a, b) => b.personalizationScore - a.personalizationScore)
      .slice(0, this.config.maxRecommendations);

    // Mix trending content with personalized (weighted)
    const mixedContent = this.mixContent(personalizedRecs, trending);

    return {
      recommendations: mixedContent,
      personalizationFactors: {
        scoreRange: { min: 0.5, max: 1.0 },
        userTier: user.membership,
        categoriesUsed: analytics.favoriteCategories
      }
    };
  }

  mixContent(personalized, trending) {
    // Smart content mixing algorithm
    const mixed = [...personalized];
    
    // Add trending content with lower priority
    trending.forEach((trend, index) => {
      if (mixed.length < this.config.maxRecommendations + 2) { // Allow some extra
        mixed.push({
          ...trend,
          personalizationScore: 0.3 - (index * 0.05), // Lower score for trending
          isTrending: true
        });
      }
    });

    return mixed.sort((a, b) => b.personalizationScore - a.personalizationScore);
  }

  async sendRecommendationNotification(user, content, analytics) {
    const context = {
      reason: analytics.favoriteCategories[0] || 'general interest',
      score: content.personalizationScore,
      userTier: user.membership
    };

    try {
      const notification = await this.notificationService.sendPersonalizedNotification(
        user, content, context
      );
      
      await this.analyticsService.trackUserEngagement(
        user.id, 
        content.id, 
        'notification_sent'
      );
      
      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  }

  sanitizeUserData(user) {
    // Remove sensitive information
    const { email, ...safeUser } = user;
    return {
      ...safeUser,
      email: this.maskEmail(user.email)
    };
  }

  maskEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.substring(0, 2) + '***' + local.substring(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  formatAnalytics(analytics) {
    return {
      engagement: {
        total: analytics.totalEngagements,
        score: analytics.retentionScore
      },
      preferences: analytics.favoriteCategories,
      behavior: {
        averageSession: analytics.averageSession,
        activityLevel: this.calculateActivityLevel(analytics.totalEngagements)
      }
    };
  }

  calculateActivityLevel(engagements) {
    if (engagements > 100) return 'high';
    if (engagements > 50) return 'medium';
    return 'low';
  }

  async refreshUserCache(userId) {
    const cacheKey = `dashboard_${userId}`;
    await this.cacheService.invalidate(cacheKey);
    
    const newDashboard = await this.getUserDashboard(userId);
    return {
      cacheRefreshed: true,
      newData: newDashboard
    };
  }

  async batchProcessUsers(userIds) {
    console.log(`🔄 Processing ${userIds.length} users...`);
    
    const results = await Promise.allSettled(
      userIds.map(userId => this.getUserDashboard(userId))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      total: userIds.length,
      successful,
      failed,
      results: results.map((result, index) => ({
        userId: userIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    };
  }
}

// Usage Example
async function demonstrateContentDelivery() {
  const contentDelivery = new ContentDeliveryFacade();
  
  try {
    // Get personalized dashboard
    const dashboard = await contentDelivery.getUserDashboard('user123');
    console.log('🎯 Personalized Dashboard:', {
      user: dashboard.user.name,
      recommendations: dashboard.content.recommendations.length,
      analytics: dashboard.analytics
    });
    
    // Batch process multiple users
    const batchResults = await contentDelivery.batchProcessUsers(['user1', 'user2', 'user3']);
    console.log('📊 Batch Results:', batchResults);
    
  } catch (error) {
    console.error('💥 Content delivery failed:', error);
  }
}

// demonstrateContentDelivery();