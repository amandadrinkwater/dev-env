/*

Key Benefits of Observer Pattern:
Loose Coupling: Subjects don't need to know details about observers

Dynamic Relationships: Observers can be added/removed at runtime

Broadcast Communication: One-to-many dependency is handled efficiently

Open/Closed Principle: Easy to add new observer types without modifying the subject

Common Real-World Uses:
Event handling systems

News feeds and notifications

Stock market updates

Social media feeds

Logging systems

MVC architecture (model notifies views)

The pattern is particularly useful when you need to maintain consistency 
between related objects without making them tightly coupled.

These advanced examples demonstrate:

Multiple Observables: Different systems publishing events

Debounced Updates: Performance optimization for high-frequency events

Filtered Subscriptions: Only receive relevant events

Middleware Pipeline: Pre-processing events

Complex Business Logic: Real-world scenarios

Error Handling & Resilience: Robust observer patterns

The Observer pattern scales beautifully for complex systems when implemented with these advanced techniques!

hese complex examples demonstrate:


*/ 

// Subject (Observable) - The object being observed

class NewsPublisher {
  constructor() {
    this.subscribers = [];
    this.latestNews = null;
  }

  // Add subscriber
  subscribe(subscriber) {
    this.subscribers.push(subscriber);
    console.log(`${subscriber.name} subscribed to news updates`);
  }

  // Remove subscriber
  unsubscribe(subscriber) {
    this.subscribers = this.subscribers.filter(sub => sub !== subscriber);
    console.log(`${subscriber.name} unsubscribed from news updates`);
  }

  // Notify all subscribers
  notifySubscribers() {
    console.log(`\n📢 Publishing breaking news: "${this.latestNews}"`);
    this.subscribers.forEach(subscriber => {
      subscriber.update(this.latestNews);
    });
  }

  // Method to publish new news
  publishNews(news) {
    this.latestNews = news;
    this.notifySubscribers();
  }

  // Get subscriber count
  getSubscriberCount() {
    return this.subscribers.length;
  }
}

// Observer Interface
class NewsSubscriber {
  constructor(name) {
    this.name = name;
  }

  update(news) {
    // To be implemented by concrete subscribers
    throw new Error('update method must be implemented');
  }
}

// Concrete Observers
class EmailSubscriber extends NewsSubscriber {
  update(news) {
    console.log(`📧 [EMAIL to ${this.name}]: "${news}" - Sent via email`);
  }
}

class SMSSubscriber extends NewsSubscriber {
  update(news) {
    console.log(`📱 [SMS to ${this.name}]: "${news}" - Sent via SMS`);
  }
}

class MobileAppSubscriber extends NewsSubscriber {
  update(news) {
    console.log(`📲 [PUSH NOTIFICATION to ${this.name}]: "${news}" - Delivered to mobile app`);
  }
}

// Usage Example
console.log("=== NEWS PUBLISHING SYSTEM ===\n");

// Create the news publisher
const breakingNews = new NewsPublisher();

// Create subscribers
const alice = new EmailSubscriber("Alice");
const bob = new SMSSubscriber("Bob");
const charlie = new MobileAppSubscriber("Charlie");
const diana = new EmailSubscriber("Diana");

// Subscribe users to news updates
breakingNews.subscribe(alice);
breakingNews.subscribe(bob);
breakingNews.subscribe(charlie);
breakingNews.subscribe(diana);

console.log(`\nTotal subscribers: ${breakingNews.getSubscriberCount()}\n`);

// Publish some news
breakingNews.publishNews("JavaScript ES2024 released with new features!");
breakingNews.publishNews("Major tech conference announced for next month");

// Bob decides to unsubscribe
breakingNews.unsubscribe(bob);

console.log(`\nTotal subscribers after Bob unsubscribed: ${breakingNews.getSubscriberCount()}\n`);

// Publish more news (Bob won't receive this)
breakingNews.publishNews("Breaking: New AI model breaks performance records");

// Add a new subscriber
const eve = new SMSSubscriber("Eve");
breakingNews.subscribe(eve);

// Final news update
breakingNews.publishNews("Weather alert: Storm warning for coastal areas");


// real world case

// Stock Market Observer Pattern
class StockMarket {
  constructor() {
    this.observers = [];
    this.stockPrices = {};
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(stockSymbol, price, change) {
    this.observers.forEach(observer => {
      observer.update(stockSymbol, price, change);
    });
  }

  setPrice(stockSymbol, price) {
    const oldPrice = this.stockPrices[stockSymbol];
    this.stockPrices[stockSymbol] = price;
    
    if (oldPrice !== undefined) {
      const change = ((price - oldPrice) / oldPrice * 100).toFixed(2);
      this.notify(stockSymbol, price, change);
    }
  }
}

class StockTrader {
  constructor(name, interestStocks = []) {
    this.name = name;
    this.interestStocks = interestStocks;
  }

  update(stockSymbol, price, change) {
    if (this.interestStocks.includes(stockSymbol)) {
      const action = change > 0 ? '📈' : '📉';
      console.log(`${action} ${this.name}: ${stockSymbol} $${price} (${change}%)`);
      
      // Automated trading logic
      if (change > 5) {
        console.log(`   → ${this.name} sells ${stockSymbol} (big gain!)`);
      } else if (change < -3) {
        console.log(`   → ${this.name} buys ${stockSymbol} (dip opportunity!)`);
      }
    }
  }
}

// Usage
console.log("\n=== STOCK MARKET MONITOR ===\n");

const nasdaq = new StockMarket();

const dayTrader = new StockTrader("Day Trader", ["AAPL", "GOOGL"]);
const longTermInvestor = new StockTrader("Long-Term Investor", ["AAPL", "TSLA", "MSFT"]);
const cryptoEnthusiast = new StockTrader("Crypto Fan", ["BTC", "ETH"]);

nasdaq.subscribe(dayTrader);
nasdaq.subscribe(longTermInvestor);
nasdaq.subscribe(cryptoEnthusiast);

// Simulate price changes
nasdaq.setPrice("AAPL", 150);
nasdaq.setPrice("GOOGL", 2800);
nasdaq.setPrice("TSLA", 800);
nasdaq.setPrice("MSFT", 300);
nasdaq.setPrice("BTC", 45000);

console.log("\n--- Market Movements ---");
nasdaq.setPrice("AAPL", 165);  // +10%
nasdaq.setPrice("TSLA", 720);  // -10%
nasdaq.setPrice("GOOGL", 2900); // +3.57%
nasdaq.setPrice("BTC", 48000);  // +6.67%

// 1. Advanced E-commerce System with Multiple Observables

// Advanced Observer Pattern with Multiple Subjects
class AdvancedObserver {
  constructor(name) {
    this.name = name;
    this.id = Math.random().toString(36).substr(2, 9);
  }

  update(subject, data) {
    throw new Error('update method must be implemented');
  }
}

// E-commerce Subjects
class ProductInventory {
  constructor() {
    this.observers = [];
    this.lowStockThreshold = 5;
    this.products = new Map();
  }

  subscribe(observer) {
    this.observers.push(observer);
    console.log(`🛒 ${observer.name} subscribed to inventory updates`);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs.id !== observer.id);
  }

  notify(product, oldStock, newStock) {
    this.observers.forEach(observer => {
      observer.update(this, { product, oldStock, newStock });
    });
  }

  addProduct(product, initialStock) {
    this.products.set(product.id, { ...product, stock: initialStock });
  }

  updateStock(productId, newStock) {
    const product = this.products.get(productId);
    if (!product) return;

    const oldStock = product.stock;
    product.stock = newStock;

    // Notify only if stock crossed important thresholds
    if ((oldStock > this.lowStockThreshold && newStock <= this.lowStockThreshold) ||
        (oldStock <= 0 && newStock > 0) ||
        (oldStock > 0 && newStock <= 0)) {
      this.notify(product, oldStock, newStock);
    }
  }

  sellProduct(productId, quantity) {
    const product = this.products.get(productId);
    if (product && product.stock >= quantity) {
      this.updateStock(productId, product.stock - quantity);
      return true;
    }
    return false;
  }
}

class OrderSystem {
  constructor() {
    this.observers = [];
    this.orders = new Map();
    this.orderCounter = 1;
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs.id !== observer.id);
  }

  notify(order, status) {
    this.observers.forEach(observer => {
      observer.update(this, { order, status });
    });
  }

  createOrder(items, customer) {
    const order = {
      id: this.orderCounter++,
      items,
      customer,
      status: 'pending',
      createdAt: new Date(),
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    this.orders.set(order.id, order);
    this.notify(order, 'created');
    return order;
  }

  updateOrderStatus(orderId, status) {
    const order = this.orders.get(orderId);
    if (order) {
      const oldStatus = order.status;
      order.status = status;
      order.updatedAt = new Date();
      this.notify(order, status);
    }
  }
}

// Complex Observers
class WarehouseManager extends AdvancedObserver {
  update(subject, data) {
    if (subject instanceof ProductInventory) {
      const { product, oldStock, newStock } = data;
      
      if (newStock <= subject.lowStockThreshold && newStock > 0) {
        console.log(`🚨 [WAREHOUSE] Low stock alert for ${product.name}: ${newStock} units left`);
        this.triggerRestock(product);
      } else if (newStock === 0) {
        console.log(`❌ [WAREHOUSE] ${product.name} is out of stock!`);
      } else if (oldStock === 0 && newStock > 0) {
        console.log(`✅ [WAREHOUSE] ${product.name} is back in stock`);
      }
    }
  }

  triggerRestock(product) {
    console.log(`📦 Auto-ordering 50 units of ${product.name}`);
    // Integration with supplier API would go here
  }
}

class CustomerServiceAgent extends AdvancedObserver {
  update(subject, data) {
    if (subject instanceof OrderSystem) {
      const { order, status } = data;
      
      if (status === 'shipped') {
        console.log(`📨 [CUSTOMER SERVICE] Notifying ${order.customer.name} about shipment`);
        this.sendShippingNotification(order);
      } else if (status === 'delayed') {
        console.log(`⚠️ [CUSTOMER SERVICE] Handling delay for order #${order.id}`);
        this.handleDelay(order);
      } else if (status === 'cancelled') {
        console.log(`🗑️ [CUSTOMER SERVICE] Processing cancellation for order #${order.id}`);
        this.processCancellation(order);
      }
    }
  }

  sendShippingNotification(order) {
    // Send email/SMS notification
    console.log(`   → Email sent to ${order.customer.email}: Your order has shipped!`);
  }

  handleDelay(order) {
    console.log(`   → Offering discount coupon to ${order.customer.name}`);
  }

  processCancellation(order) {
    console.log(`   → Initiating refund process for $${order.total}`);
  }
}

class AnalyticsEngine extends AdvancedObserver {
  constructor() {
    super('Analytics Engine');
    this.metrics = {
      lowStockEvents: 0,
      ordersCreated: 0,
      ordersShipped: 0,
      revenue: 0
    };
  }

  update(subject, data) {
    if (subject instanceof ProductInventory) {
      this.metrics.lowStockEvents++;
      this.logMetrics();
    } else if (subject instanceof OrderSystem) {
      const { order, status } = data;
      
      if (status === 'created') {
        this.metrics.ordersCreated++;
        this.metrics.revenue += order.total;
      } else if (status === 'shipped') {
        this.metrics.ordersShipped++;
      }
      
      this.logMetrics();
    }
  }

  logMetrics() {
    console.log(`📊 [ANALYTICS] Orders: ${this.metrics.ordersCreated} | Shipped: ${this.metrics.ordersShipped} | Revenue: $${this.metrics.revenue} | Low Stock Events: ${this.metrics.lowStockEvents}`);
  }
}

// Usage
console.log("=== ADVANCED E-COMMERCE SYSTEM ===\n");

const inventory = new ProductInventory();
const orderSystem = new OrderSystem();

const warehouseManager = new WarehouseManager('Warehouse Manager');
const customerService = new CustomerServiceAgent('Customer Service');
const analytics = new AnalyticsEngine();

// Subscribe observers to multiple subjects
inventory.subscribe(warehouseManager);
inventory.subscribe(analytics);

orderSystem.subscribe(customerService);
orderSystem.subscribe(analytics);

// Add products
const products = [
  { id: 1, name: 'iPhone 15', price: 999 },
  { id: 2, name: 'MacBook Pro', price: 2399 },
  { id: 3, name: 'AirPods', price: 179 }
];

products.forEach(product => inventory.addProduct(product, 10));

// Simulate business operations
console.log('\n--- Business Operations Simulation ---');

// Sell products triggering inventory updates
inventory.sellProduct(1, 6); // Should trigger low stock
inventory.sellProduct(1, 4); // Should trigger out of stock
inventory.updateStock(1, 20); // Should trigger back in stock

// Create orders
const customer = { name: 'John Doe', email: 'john@example.com' };
const order1 = orderSystem.createOrder([
  { productId: 2, quantity: 1, price: 2399 },
  { productId: 3, quantity: 2, price: 179 }
], customer);

orderSystem.updateOrderStatus(order1.id, 'shipped');
orderSystem.updateOrderStatus(order1.id, 'delayed');

// Real-time Dashboard with Debounced Updates

// Real-time Dashboard with Performance Optimizations
class DebouncedObserver {
  constructor(name, delay = 100) {
    this.name = name;
    this.delay = delay;
    this.timeoutId = null;
    this.pendingUpdates = new Set();
  }

  update(subject, data) {
    this.pendingUpdates.add({ subject, data, timestamp: Date.now() });
    
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.processBatch();
      }, this.delay);
    }
  }

  processBatch() {
    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.timeoutId = null;

    this.processUpdates(updates);
  }

  processUpdates(updates) {
    throw new Error('processUpdates must be implemented');
  }
}

class StockTicker {
  constructor() {
    this.observers = [];
    this.stocks = new Map();
    this.updateInterval = null;
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(stock, price, change, volume) {
    this.observers.forEach(observer => {
      observer.update(this, { stock, price, change, volume, timestamp: Date.now() });
    });
  }

  addStock(symbol, initialPrice) {
    this.stocks.set(symbol, {
      symbol,
      price: initialPrice,
      history: []
    });
  }

  startTrading() {
    console.log('🎯 Starting stock market simulation...');
    this.updateInterval = setInterval(() => {
      this.simulatePriceChanges();
    }, 500);
  }

  stopTrading() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  simulatePriceChanges() {
    for (const [symbol, stock] of this.stocks) {
      const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
      const oldPrice = stock.price;
      const newPrice = Math.max(0.01, oldPrice * (1 + changePercent / 100));
      const change = newPrice - oldPrice;
      const volume = Math.floor(Math.random() * 10000) + 1000;

      stock.price = newPrice;
      stock.history.push({ price: newPrice, timestamp: Date.now() });

      // Keep only last 100 price points
      if (stock.history.length > 100) {
        stock.history.shift();
      }

      this.notify(stock, newPrice, change, volume);
    }
  }
}

class TradingDashboard extends DebouncedObserver {
  constructor() {
    super('Trading Dashboard', 200);
    this.stockData = new Map();
    this.uiUpdates = 0;
  }

  processUpdates(updates) {
    console.log(`\n📈 [DASHBOARD] Processing ${updates.length} batched updates (UI Update #${++this.uiUpdates})`);
    
    updates.forEach(({ data }) => {
      const { stock, price, change, volume } = data;
      
      if (!this.stockData.has(stock.symbol)) {
        this.stockData.set(stock.symbol, {
          symbol: stock.symbol,
          prices: [],
          volumes: []
        });
      }

      const stockData = this.stockData.get(stock.symbol);
      stockData.prices.push(price);
      stockData.volumes.push(volume);

      // Keep reasonable history
      if (stockData.prices.length > 50) stockData.prices.shift();
      if (stockData.volumes.length > 50) stockData.volumes.shift();

      this.renderStock(stock.symbol, price, change, volume);
    });

    this.renderSummary();
  }

  renderStock(symbol, price, change, volume) {
    const trend = change >= 0 ? '🟢' : '🔴';
    console.log(`   ${trend} ${symbol}: $${price.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}) - Volume: ${volume}`);
  }

  renderSummary() {
    const stocks = Array.from(this.stockData.values());
    const totalValue = stocks.reduce((sum, stock) => sum + (stock.prices[stock.prices.length - 1] || 0), 0);
    console.log(`   💰 Portfolio Value: $${totalValue.toFixed(2)} | Stocks: ${stocks.length}`);
  }
}

class RiskManager extends DebouncedObserver {
  constructor(alertThreshold = -5) {
    super('Risk Manager', 1000); // Longer debounce for risk analysis
    this.alertThreshold = alertThreshold;
    this.priceHistory = new Map();
    this.alertsTriggered = new Set();
  }

  processUpdates(updates) {
    const significantMoves = updates.filter(({ data }) => {
      const { stock, change } = data;
      const changePercent = (change / stock.price) * 100;
      return Math.abs(changePercent) > 2; // Only care about moves > 2%
    });

    if (significantMoves.length > 0) {
      console.log(`\n⚠️ [RISK MANAGER] Analyzing ${significantMoves.length} significant moves`);
      
      significantMoves.forEach(({ data }) => {
        this.analyzeRisk(data);
      });
    }
  }

  analyzeRisk({ stock, price, change }) {
    const changePercent = (change / stock.price) * 100;
    
    if (changePercent < this.alertThreshold && !this.alertsTriggered.has(stock.symbol)) {
      console.log(`   🚨 RISK ALERT: ${stock.symbol} dropped ${changePercent.toFixed(2)}% to $${price.toFixed(2)}`);
      this.alertsTriggered.add(stock.symbol);
      this.triggerHedge(stock.symbol);
    }
  }

  triggerHedge(symbol) {
    console.log(`   🛡️  Executing hedge for ${symbol}`);
    // Actual hedging logic would go here
  }
}

// Usage
console.log("\n=== REAL-TIME TRADING DASHBOARD ===\n");

const stockTicker = new StockTicker();
const dashboard = new TradingDashboard();
const riskManager = new RiskManager();

// Add popular stocks
const popularStocks = [
  ['AAPL', 150],
  ['GOOGL', 2800],
  ['TSLA', 250],
  ['MSFT', 330],
  ['AMZN', 3400]
];

popularStocks.forEach(([symbol, price]) => {
  stockTicker.addStock(symbol, price);
});

stockTicker.subscribe(dashboard);
stockTicker.subscribe(riskManager);

// Start simulated trading
stockTicker.startTrading();

// Stop after 10 seconds
setTimeout(() => {
  console.log('\n=== STOPPING TRADING ===');
  stockTicker.stopTrading();
}, 10000);

// 3. Microservices Event Bus with Filtering

// Advanced Event Bus for Microservices Architecture
class MicroserviceEventBus {
  constructor() {
    this.subscriptions = new Map();
    this.middlewares = [];
  }

  // Advanced subscription with filters
  subscribe(service, eventTypes = [], filters = {}) {
    const subscription = {
      service,
      eventTypes: new Set(eventTypes),
      filters,
      id: Math.random().toString(36).substr(2, 9)
    };

    if (!this.subscriptions.has(service.name)) {
      this.subscriptions.set(service.name, []);
    }
    this.subscriptions.get(service.name).push(subscription);

    console.log(`🔔 ${service.name} subscribed to events: ${eventTypes.join(', ') || 'ALL'}`);
    return subscription.id;
  }

  unsubscribe(serviceName, subscriptionId) {
    const serviceSubs = this.subscriptions.get(serviceName);
    if (serviceSubs) {
      this.subscriptions.set(serviceName, 
        serviceSubs.filter(sub => sub.id !== subscriptionId)
      );
    }
  }

  // Middleware support
  use(middleware) {
    this.middlewares.push(middleware);
  }

  async publish(event) {
    // Apply middleware
    let processedEvent = { ...event, timestamp: new Date() };
    
    for (const middleware of this.middlewares) {
      processedEvent = await middleware(processedEvent);
      if (!processedEvent) return; // Middleware can stop propagation
    }

    // Notify subscribers
    for (const [serviceName, subscriptions] of this.subscriptions) {
      subscriptions.forEach(subscription => {
        if (this.shouldNotify(subscription, processedEvent)) {
          subscription.service.handleEvent(processedEvent);
        }
      });
    }
  }

  shouldNotify(subscription, event) {
    // Check event type filter
    if (subscription.eventTypes.size > 0 && 
        !subscription.eventTypes.has(event.type)) {
      return false;
    }

    // Check custom filters
    const { filters } = subscription;
    for (const [key, value] of Object.entries(filters)) {
      if (event[key] !== value) {
        return false;
      }
    }

    return true;
  }
}

// Microservices
class UserService {
  constructor() {
    this.name = 'UserService';
    this.users = new Map();
  }

  handleEvent(event) {
    switch (event.type) {
      case 'ORDER_CREATED':
        this.updateUserStats(event.payload.userId, 'orderCount');
        break;
      case 'PAYMENT_PROCESSED':
        this.updateUserStats(event.payload.userId, 'totalSpent', event.payload.amount);
        break;
      default:
        console.log(`👤 [UserService] Received event: ${event.type}`);
    }
  }

  updateUserStats(userId, field, value = 1) {
    if (!this.users.has(userId)) {
      this.users.set(userId, { orderCount: 0, totalSpent: 0 });
    }
    
    const user = this.users.get(userId);
    if (field === 'orderCount') {
      user.orderCount += value;
    } else if (field === 'totalSpent') {
      user.totalSpent += value;
    }

    console.log(`👤 [UserService] Updated ${userId}: ${field} = ${user[field]}`);
  }
}

class AnalyticsService {
  constructor() {
    this.name = 'AnalyticsService';
    this.metrics = {
      eventsProcessed: 0,
      revenue: 0,
      orders: 0
    };
  }

  handleEvent(event) {
    this.metrics.eventsProcessed++;
    
    switch (event.type) {
      case 'ORDER_CREATED':
        this.metrics.orders++;
        console.log(`📊 [Analytics] Order #${event.payload.orderId} created`);
        break;
      case 'PAYMENT_PROCESSED':
        this.metrics.revenue += event.payload.amount;
        console.log(`💰 [Analytics] Revenue: $${this.metrics.revenue} | Orders: ${this.metrics.orders}`);
        break;
    }
  }
}

class NotificationService {
  constructor() {
    this.name = 'NotificationService';
  }

  handleEvent(event) {
    switch (event.type) {
      case 'ORDER_SHIPPED':
        this.sendShippingNotification(event.payload);
        break;
      case 'PAYMENT_FAILED':
        this.sendPaymentFailedNotification(event.payload);
        break;
    }
  }

  sendShippingNotification(payload) {
    console.log(`📧 [Notifications] Shipping confirmation sent to ${payload.userEmail} for order #${payload.orderId}`);
  }

  sendPaymentFailedNotification(payload) {
    console.log(`❌ [Notifications] Payment failed notification sent to ${payload.userEmail}`);
  }
}

// Middlewares
const loggingMiddleware = async (event) => {
  console.log(`📝 [Middleware] Event logged: ${event.type}`, {
    timestamp: event.timestamp,
    payload: event.payload
  });
  return event;
};

const validationMiddleware = async (event) => {
  if (!event.type || !event.payload) {
    console.log('❌ [Middleware] Invalid event format');
    return null;
  }
  return event;
};

const rateLimitingMiddleware = (() => {
  const eventCounts = new Map();
  return async (event) => {
    const count = eventCounts.get(event.type) || 0;
    if (count > 100) { // Limit to 100 events per type
      console.log(`🚫 [Middleware] Rate limit exceeded for ${event.type}`);
      return null;
    }
    eventCounts.set(event.type, count + 1);
    return event;
  };
})();

// Usage
console.log("\n=== MICROSERVICES EVENT BUS ===\n");

const eventBus = new MicroserviceEventBus();

// Add middlewares
eventBus.use(loggingMiddleware);
eventBus.use(validationMiddleware);
eventBus.use(rateLimitingMiddleware);

// Create services
const userService = new UserService();
const analyticsService = new AnalyticsService();
const notificationService = new NotificationService();

// Subscribe with filters
eventBus.subscribe(userService, ['ORDER_CREATED', 'PAYMENT_PROCESSED']);
eventBus.subscribe(analyticsService, ['ORDER_CREATED', 'PAYMENT_PROCESSED', 'ORDER_SHIPPED']);
eventBus.subscribe(notificationService, ['ORDER_SHIPPED', 'PAYMENT_FAILED'], {
  priority: 'high' // Only high priority notifications
});

// Simulate events
console.log('\n--- Publishing Events ---');
eventBus.publish({
  type: 'ORDER_CREATED',
  payload: {
    orderId: 'ORD-001',
    userId: 'USER-123',
    items: [{ productId: 'PROD-1', quantity: 2 }],
    total: 199.98
  }
});

eventBus.publish({
  type: 'PAYMENT_PROCESSED',
  payload: {
    orderId: 'ORD-001',
    userId: 'USER-123',
    amount: 199.98,
    paymentMethod: 'credit_card'
  }
});

eventBus.publish({
  type: 'ORDER_SHIPPED',
  payload: {
    orderId: 'ORD-001',
    userEmail: 'user@example.com',
    trackingNumber: 'TRK-123456',
    priority: 'high'
  }
});

eventBus.publish({
  type: 'PAYMENT_FAILED',
  payload: {
    orderId: 'ORD-002',
    userEmail: 'user2@example.com',
    reason: 'insufficient_funds',
    priority: 'high'
  }
});

