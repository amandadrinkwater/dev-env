
// Strategy Pattern Example
// Defines a family of algorithms, encapsulates each one, and makes them interchangeable

// Strategy interface (in JavaScript, this is just a convention)
class PaymentStrategy {
    pay(amount) {
        throw new Error("pay() method must be implemented");
    }
}

// Concrete strategies
class CreditCardStrategy extends PaymentStrategy {
    constructor(cardNumber, cardHolder) {
        super();
        this.cardNumber = cardNumber;
        this.cardHolder = cardHolder;
    }

    pay(amount) {
        console.log(`Paid $${amount} using Credit Card ending in ${this.cardNumber.slice(-4)}`);
        console.log(`Cardholder: ${this.cardHolder}`);
        return `Credit Card payment of $${amount} processed`;
    }
}

class PayPalStrategy extends PaymentStrategy {
    constructor(email) {
        super();
        this.email = email;
    }

    pay(amount) {
        console.log(`Paid $${amount} using PayPal account: ${this.email}`);
        return `PayPal payment of $${amount} processed`;
    }
}

class CryptoStrategy extends PaymentStrategy {
    constructor(walletAddress) {
        super();
        this.walletAddress = walletAddress;
    }

    pay(amount) {
        console.log(`Paid $${amount} using Crypto wallet: ${this.walletAddress}`);
        return `Crypto payment of $${amount} processed`;
    }
}

// Context class that uses the strategy
class ShoppingCart {
    constructor() {
        this.items = [];
        this.paymentStrategy = null;
    }

    addItem(item, price) {
        this.items.push({ item, price });
        console.log(`Added ${item} ($${price}) to cart`);
    }

    setPaymentStrategy(strategy) {
        this.paymentStrategy = strategy;
        console.log('Payment method set');
    }

    calculateTotal() {
        return this.items.reduce((total, item) => total + item.price, 0);
    }

    checkout() {
        if (!this.paymentStrategy) {
            throw new Error('Payment strategy not set');
        }

        const total = this.calculateTotal();
        console.log(`\nChecking out with total: $${total}`);
        return this.paymentStrategy.pay(total);
    }

    getItems() {
        return this.items;
    }
}

// Demo function
function demonstrateStrategy() {
    console.log('=== Strategy Pattern Demo ===\n');

    const cart = new ShoppingCart();
    
    // Add items to cart
    cart.addItem('Laptop', 999.99);
    cart.addItem('Mouse', 29.99);
    cart.addItem('Keyboard', 79.99);

    console.log('\n--- Payment with Credit Card ---');
    const creditCard = new CreditCardStrategy('1234567890123456', 'John Doe');
    cart.setPaymentStrategy(creditCard);
    cart.checkout();

    console.log('\n--- Payment with PayPal ---');
    const paypal = new PayPalStrategy('john.doe@email.com');
    cart.setPaymentStrategy(paypal);
    cart.checkout();

    console.log('\n--- Payment with Crypto ---');
    const crypto = new CryptoStrategy('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    cart.setPaymentStrategy(crypto);
    cart.checkout();
}

module.exports = { 
    PaymentStrategy, 
    CreditCardStrategy, 
    PayPalStrategy, 
    CryptoStrategy, 
    ShoppingCart,
    demonstrateStrategy
};

// Run demonstration if this file is executed directly
if (require.main === module) {
    demonstrateStrategy();
}
