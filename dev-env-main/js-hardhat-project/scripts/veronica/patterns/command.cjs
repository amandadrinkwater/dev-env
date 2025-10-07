/*

Key Benefits in Real-World Scenarios:
Undo/Redo functionality - Essential for editors, forms, and any user-facing application

Transactional operations - Ensure all steps complete or none do (like order processing)

Queue and scheduling - Batch process commands or schedule for later execution

Decoupling - Separates the invoker from the receiver

Macro commands - Combine multiple commands into one

The Command Pattern is particularly useful when you need:

Audit trails of operations

Transaction rollback capabilities

Delayed execution (queues)

Complex undo/redo functionality

Would you like me to elaborate on any specific aspect or show more complex examples?

Composite Commands - Grouping multiple operations

Transaction Safety - All-or-nothing execution

Undo/Redo with State Management - Proper state tracking

Validation & Preconditions - Ensuring commands can execute

Async Operations - Real-world timing considerations

Distributed Systems - Multi-node command execution

Persistence & Serialization - Saving/loading command state

Error Handling & Retry Logic - Robust failure recovery



*/


// Command Interface
class Command {
  execute() {}
  undo() {}
}

// Receiver - knows how to perform the operations
class Light {
  turnOn() {
    console.log('Light is ON');
    return 'on';
  }
  
  turnOff() {
    console.log('Light is OFF');
    return 'off';
  }
}

class Thermostat {
  setTemperature(temp) {
    console.log(`Thermostat set to ${temp}°C`);
    return temp;
  }
}

// Concrete Commands
class LightOnCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
    this.previousState = null;
  }
  
  execute() {
    this.previousState = this.light.turnOn();
  }
  
  undo() {
    if (this.previousState === 'on') {
      this.light.turnOff();
    }
  }
}

class LightOffCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
    this.previousState = null;
  }
  
  execute() {
    this.previousState = this.light.turnOff();
  }
  
  undo() {
    if (this.previousState === 'off') {
      this.light.turnOn();
    }
  }
}

class SetTemperatureCommand extends Command {
  constructor(thermostat, temperature, previousTemp = 21) {
    super();
    this.thermostat = thermostat;
    this.temperature = temperature;
    this.previousTemperature = previousTemp;
  }
  
  execute() {
    const currentTemp = this.thermostat.setTemperature(this.temperature);
    this.previousTemperature = currentTemp;
  }
  
  undo() {
    this.thermostat.setTemperature(this.previousTemperature);
  }
}

// Invoker - asks the command to carry out the request
class RemoteControl {
  constructor() {
    this.commands = [];
    this.history = [];
  }
  
  setCommand(command) {
    this.commands.push(command);
  }
  
  executeCommands() {
    this.commands.forEach(command => {
      command.execute();
      this.history.push(command);
    });
    this.commands = [];
  }
  
  undoLast() {
    if (this.history.length > 0) {
      const lastCommand = this.history.pop();
      lastCommand.undo();
    }
  }
}

// real world usage e-commerce order system

// Command Pattern for Order Processing
class OrderCommand {
  execute() {}
  undo() {}
}

// Receiver Classes
class InventoryService {
  constructor() {
    this.items = new Map([
      ['laptop', { name: 'Laptop', price: 999, stock: 10 }],
      ['phone', { name: 'Phone', price: 499, stock: 20 }],
      ['headphones', { name: 'Headphones', price: 99, stock: 50 }]
    ]);
  }

  reserveItem(productId, quantity) {
    const item = this.items.get(productId);
    if (item && item.stock >= quantity) {
      item.stock -= quantity;
      console.log(`Reserved ${quantity} ${item.name}(s). Remaining stock: ${item.stock}`);
      return true;
    }
    console.log(`Insufficient stock for ${productId}`);
    return false;
  }

  releaseItem(productId, quantity) {
    const item = this.items.get(productId);
    if (item) {
      item.stock += quantity;
      console.log(`Released ${quantity} ${item.name}(s). Current stock: ${item.stock}`);
    }
  }

  getItem(productId) {
    return this.items.get(productId);
  }
}

class PaymentService {
  processPayment(amount, paymentMethod) {
    console.log(`Processing $${amount} payment via ${paymentMethod}...`);
    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate
    if (success) {
      console.log(`Payment of $${amount} successful`);
      return true;
    } else {
      console.log('Payment failed');
      return false;
    }
  }

  refundPayment(amount, paymentMethod) {
    console.log(`Refunding $${amount} via ${paymentMethod}...`);
    return true;
  }
}

class ShippingService {
  scheduleShipping(address, items) {
    console.log(`Shipping scheduled to: ${address}`);
    console.log(`Items: ${items.map(item => item.name).join(', ')}`);
    return `SHIP-${Date.now()}`;
  }

  cancelShipping(trackingNumber) {
    console.log(`Shipping canceled for tracking: ${trackingNumber}`);
  }
}

// Concrete Commands
class CreateOrderCommand extends OrderCommand {
  constructor(inventory, payment, shipping, orderDetails) {
    super();
    this.inventory = inventory;
    this.payment = payment;
    this.shipping = shipping;
    this.orderDetails = orderDetails;
    this.executed = false;
    this.trackingNumber = null;
  }

  execute() {
    try {
      // Step 1: Reserve inventory
      const reserveSuccess = this.inventory.reserveItem(
        this.orderDetails.productId, 
        this.orderDetails.quantity
      );
      
      if (!reserveSuccess) {
        throw new Error('Insufficient inventory');
      }

      // Step 2: Process payment
      const item = this.inventory.getItem(this.orderDetails.productId);
      const totalAmount = item.price * this.orderDetails.quantity;
      
      const paymentSuccess = this.payment.processPayment(
        totalAmount, 
        this.orderDetails.paymentMethod
      );
      
      if (!paymentSuccess) {
        this.inventory.releaseItem(this.orderDetails.productId, this.orderDetails.quantity);
        throw new Error('Payment failed');
      }

      // Step 3: Schedule shipping
      this.trackingNumber = this.shipping.scheduleShipping(
        this.orderDetails.shippingAddress,
        [{ ...item, quantity: this.orderDetails.quantity }]
      );

      this.executed = true;
      console.log('Order created successfully!');
      return { success: true, trackingNumber: this.trackingNumber };

    } catch (error) {
      console.error('Order creation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  undo() {
    if (this.executed) {
      console.log('Rolling back order...');
      
      // Release inventory
      this.inventory.releaseItem(
        this.orderDetails.productId, 
        this.orderDetails.quantity
      );
      
      // Refund payment
      const item = this.inventory.getItem(this.orderDetails.productId);
      const totalAmount = item.price * this.orderDetails.quantity;
      this.payment.refundPayment(totalAmount, this.orderDetails.paymentMethod);
      
      // Cancel shipping
      if (this.trackingNumber) {
        this.shipping.cancelShipping(this.trackingNumber);
      }
      
      this.executed = false;
      console.log('Order rolled back successfully');
    }
  }
}

// Order Manager (Invoker)
class OrderManager {
  constructor() {
    this.commandHistory = [];
    this.pendingCommands = [];
  }

  addCommand(command) {
    this.pendingCommands.push(command);
  }

  processOrders() {
    const results = [];
    this.pendingCommands.forEach(command => {
      const result = command.execute();
      if (result.success) {
        this.commandHistory.push(command);
      }
      results.push(result);
    });
    this.pendingCommands = [];
    return results;
  }

  undoLastOrder() {
    if (this.commandHistory.length > 0) {
      const lastCommand = this.commandHistory.pop();
      lastCommand.undo();
    }
  }

  getHistory() {
    return this.commandHistory.map((cmd, index) => ({
      orderNumber: index + 1,
      product: cmd.orderDetails.productId,
      quantity: cmd.orderDetails.quantity
    }));
  }
}

// Usage Example
const inventory = new InventoryService();
const payment = new PaymentService();
const shipping = new ShippingService();
const orderManager = new OrderManager();

// Create multiple orders
const order1 = new CreateOrderCommand(inventory, payment, shipping, {
  productId: 'laptop',
  quantity: 1,
  paymentMethod: 'credit_card',
  shippingAddress: '123 Main St, City, Country'
});

const order2 = new CreateOrderCommand(inventory, payment, shipping, {
  productId: 'phone',
  quantity: 2,
  paymentMethod: 'paypal',
  shippingAddress: '456 Oak Ave, Town, Country'
});

// Add orders to queue
orderManager.addCommand(order1);
orderManager.addCommand(order2);

// Process all orders
console.log('=== PROCESSING ORDERS ===');
const results = orderManager.processOrders();

console.log('\n=== ORDER HISTORY ===');
console.log(orderManager.getHistory());

// Simulate undoing the last order
console.log('\n=== UNDO LAST ORDER ===');
orderManager.undoLastOrder();

// Another Real-World Example: Text Editor with Undo/Redo

// Text Editor Command Pattern
class TextEditorCommand {
  constructor(editor) {
    this.editor = editor;
    this.backup = '';
  }
  
  saveBackup() {
    this.backup = this.editor.text;
  }
  
  undo() {
    this.editor.text = this.backup;
  }
}

class AddTextCommand extends TextEditorCommand {
  constructor(editor, textToAdd, position) {
    super(editor);
    this.textToAdd = textToAdd;
    this.position = position;
  }
  
  execute() {
    this.saveBackup();
    const textArray = this.editor.text.split('');
    textArray.splice(this.position, 0, this.textToAdd);
    this.editor.text = textArray.join('');
    return true;
  }
}

class DeleteTextCommand extends TextEditorCommand {
  constructor(editor, position, length) {
    super(editor);
    this.position = position;
    this.length = length;
    this.deletedText = '';
  }
  
  execute() {
    this.saveBackup();
    this.deletedText = this.editor.text.substr(this.position, this.length);
    this.editor.text = this.editor.text.slice(0, this.position) + 
                      this.editor.text.slice(this.position + this.length);
    return true;
  }
}

class TextEditor {
  constructor() {
    this.text = '';
    this.commandHistory = [];
    this.redoStack = [];
  }
  
  executeCommand(command) {
    if (command.execute()) {
      this.commandHistory.push(command);
      this.redoStack = []; // Clear redo stack when new command is executed
    }
  }
  
  undo() {
    if (this.commandHistory.length > 0) {
      const command = this.commandHistory.pop();
      command.undo();
      this.redoStack.push(command);
    }
  }
  
  redo() {
    if (this.redoStack.length > 0) {
      const command = this.redoStack.pop();
      command.execute();
      this.commandHistory.push(command);
    }
  }
  
  getText() {
    return this.text;
  }
}

// Usage
const editor = new TextEditor();

const addHello = new AddTextCommand(editor, 'Hello', 0);
const addWorld = new AddTextCommand(editor, ' World!', 5);
const deleteText = new DeleteTextCommand(editor, 5, 6);

editor.executeCommand(addHello);
console.log('After adding "Hello":', editor.getText());

editor.executeCommand(addWorld);
console.log('After adding " World!":', editor.getText());

editor.undo();
console.log('After undo:', editor.getText());

editor.redo();
console.log('After redo:', editor.getText());

editor.executeCommand(deleteText);
console.log('After deleting " World!":', editor.getText());

editor.undo();
console.log('After undo:', editor.getText());

// Example 1: Advanced Banking System with Composite Commands

// Advanced Command System for Banking Operations
class BankingCommand {
    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
        this.timestamp = new Date();
    }
    
    execute() {}
    undo() {}
    redo() {}
    serialize() {}
    static deserialize(data) { return new this(); }
}

// Composite Command - Executes multiple commands
class CompositeCommand extends BankingCommand {
    constructor(name = 'Composite Command') {
        super();
        this.name = name;
        this.commands = [];
        this.executionState = [];
    }
    
    addCommand(command) {
        this.commands.push(command);
        return this;
    }
    
    execute() {
        console.log(`\n🔧 Executing ${this.name} (${this.commands.length} operations)`);
        this.executionState = [];
        
        for (let i = 0; i < this.commands.length; i++) {
            try {
                const result = this.commands[i].execute();
                this.executionState.push({ success: true, index: i, result });
                console.log(`✅ Operation ${i + 1} completed`);
            } catch (error) {
                this.executionState.push({ success: false, index: i, error });
                console.log(`❌ Operation ${i + 1} failed: ${error.message}`);
                // Rollback completed operations
                this.rollback(i);
                throw new Error(`Composite command failed at operation ${i + 1}`);
            }
        }
        
        return { success: true, operations: this.commands.length };
    }
    
    rollback(failedIndex) {
        console.log(`🔄 Rolling back ${failedIndex} completed operations...`);
        for (let i = failedIndex - 1; i >= 0; i--) {
            if (this.executionState[i].success) {
                this.commands[i].undo();
                console.log(`↩️ Rolled back operation ${i + 1}`);
            }
        }
    }
    
    undo() {
        console.log(`\n⏪ Undoing ${this.name}`);
        for (let i = this.commands.length - 1; i >= 0; i--) {
            if (this.executionState[i]?.success) {
                this.commands[i].undo();
            }
        }
    }
    
    redo() {
        console.log(`\n🔁 Redoing ${this.name}`);
        this.execute();
    }
    
    serialize() {
        return {
            type: 'CompositeCommand',
            id: this.id,
            name: this.name,
            timestamp: this.timestamp,
            commands: this.commands.map(cmd => cmd.serialize())
        };
    }
}

// Banking Service (Receiver)
class BankAccount {
    constructor(accountNumber, initialBalance = 0) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
        this.transactionHistory = [];
    }
    
    deposit(amount, description = 'Deposit') {
        if (amount <= 0) throw new Error('Deposit amount must be positive');
        
        const oldBalance = this.balance;
        this.balance += amount;
        
        const transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'DEPOSIT',
            amount,
            description,
            oldBalance,
            newBalance: this.balance,
            timestamp: new Date()
        };
        
        this.transactionHistory.push(transaction);
        console.log(`💰 Deposited $${amount} to ${this.accountNumber}. New balance: $${this.balance}`);
        
        return transaction;
    }
    
    withdraw(amount, description = 'Withdrawal') {
        if (amount <= 0) throw new Error('Withdrawal amount must be positive');
        if (amount > this.balance) throw new Error('Insufficient funds');
        
        const oldBalance = this.balance;
        this.balance -= amount;
        
        const transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'WITHDRAWAL',
            amount,
            description,
            oldBalance,
            newBalance: this.balance,
            timestamp: new Date()
        };
        
        this.transactionHistory.push(transaction);
        console.log(`💸 Withdrew $${amount} from ${this.accountNumber}. New balance: $${this.balance}`);
        
        return transaction;
    }
    
    transfer(amount, toAccount, description = 'Transfer') {
        if (amount <= 0) throw new Error('Transfer amount must be positive');
        if (amount > this.balance) throw new Error('Insufficient funds for transfer');
        
        const oldBalance = this.balance;
        this.balance -= amount;
        toAccount.balance += amount;
        
        const transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'TRANSFER',
            amount,
            description,
            fromAccount: this.accountNumber,
            toAccount: toAccount.accountNumber,
            oldBalance,
            newBalance: this.balance,
            timestamp: new Date()
        };
        
        this.transactionHistory.push(transaction);
        console.log(`🔀 Transferred $${amount} from ${this.accountNumber} to ${toAccount.accountNumber}`);
        
        return transaction;
    }
    
    getTransaction(transactionId) {
        return this.transactionHistory.find(t => t.id === transactionId);
    }
    
    revertTransaction(transactionId) {
        const transaction = this.getTransaction(transactionId);
        if (!transaction) throw new Error('Transaction not found');
        
        switch (transaction.type) {
            case 'DEPOSIT':
                this.balance = transaction.oldBalance;
                break;
            case 'WITHDRAWAL':
                this.balance = transaction.oldBalance;
                break;
            case 'TRANSFER':
                // This would need access to the target account for full reversal
                this.balance = transaction.oldBalance;
                break;
        }
        
        console.log(`↩️ Reverted transaction ${transactionId}`);
        return transaction;
    }
}

// Concrete Banking Commands
class DepositCommand extends BankingCommand {
    constructor(account, amount, description = 'Deposit') {
        super();
        this.account = account;
        this.amount = amount;
        this.description = description;
        this.transaction = null;
    }
    
    execute() {
        this.transaction = this.account.deposit(this.amount, this.description);
        return this.transaction;
    }
    
    undo() {
        if (this.transaction) {
            this.account.revertTransaction(this.transaction.id);
        }
    }
    
    redo() {
        this.execute();
    }
    
    serialize() {
        return {
            type: 'DepositCommand',
            id: this.id,
            accountNumber: this.account.accountNumber,
            amount: this.amount,
            description: this.description,
            timestamp: this.timestamp
        };
    }
}

class WithdrawCommand extends BankingCommand {
    constructor(account, amount, description = 'Withdrawal') {
        super();
        this.account = account;
        this.amount = amount;
        this.description = description;
        this.transaction = null;
    }
    
    execute() {
        this.transaction = this.account.withdraw(this.amount, this.description);
        return this.transaction;
    }
    
    undo() {
        if (this.transaction) {
            this.account.revertTransaction(this.transaction.id);
        }
    }
    
    redo() {
        this.execute();
    }
    
    serialize() {
        return {
            type: 'WithdrawCommand',
            id: this.id,
            accountNumber: this.account.accountNumber,
            amount: this.amount,
            description: this.description,
            timestamp: this.timestamp
        };
    }
}

class TransferCommand extends BankingCommand {
    constructor(fromAccount, toAccount, amount, description = 'Transfer') {
        super();
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.amount = amount;
        this.description = description;
        this.transaction = null;
    }
    
    execute() {
        this.transaction = this.fromAccount.transfer(this.amount, this.toAccount, this.description);
        return this.transaction;
    }
    
    undo() {
        if (this.transaction) {
            this.fromAccount.revertTransaction(this.transaction.id);
            // Note: In a real system, you'd also reverse the receiving account's transaction
        }
    }
    
    redo() {
        this.execute();
    }
    
    serialize() {
        return {
            type: 'TransferCommand',
            id: this.id,
            fromAccount: this.fromAccount.accountNumber,
            toAccount: this.toAccount.accountNumber,
            amount: this.amount,
            description: this.description,
            timestamp: this.timestamp
        };
    }
}

// Advanced Command Manager with Persistence
class BankingCommandManager {
    constructor() {
        this.history = [];
        this.redoStack = [];
        this.maxHistorySize = 100;
    }
    
    execute(command) {
        try {
            const result = command.execute();
            this.history.push(command);
            this.redoStack = []; // Clear redo stack on new command
            
            // Limit history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
            }
            
            console.log(`✅ Command executed successfully: ${command.constructor.name}`);
            return result;
        } catch (error) {
            console.error(`❌ Command execution failed: ${error.message}`);
            throw error;
        }
    }
    
    executeComposite(compositeCommand) {
        return this.execute(compositeCommand);
    }
    
    undo() {
        if (this.history.length > 0) {
            const command = this.history.pop();
            command.undo();
            this.redoStack.push(command);
            console.log(`↩️ Undid command: ${command.constructor.name}`);
            return command;
        }
        console.log('📭 No commands to undo');
        return null;
    }
    
    redo() {
        if (this.redoStack.length > 0) {
            const command = this.redoStack.pop();
            command.redo();
            this.history.push(command);
            console.log(`🔁 Redid command: ${command.constructor.name}`);
            return command;
        }
        console.log('📭 No commands to redo');
        return null;
    }
    
    getHistory() {
        return this.history.map(cmd => ({
            type: cmd.constructor.name,
            id: cmd.id,
            timestamp: cmd.timestamp,
            data: cmd.serialize ? cmd.serialize() : null
        }));
    }
    
    clearHistory() {
        this.history = [];
        this.redoStack = [];
    }
    
    // Save/Load state for persistence
    saveState() {
        return {
            history: this.history.map(cmd => cmd.serialize()),
            redoStack: this.redoStack.map(cmd => cmd.serialize())
        };
    }
    
    loadState(state) {
        // In a real app, you'd deserialize commands based on their type
        console.log('Loading command state:', state);
    }
}

// Usage Example
console.log('🏦 ADVANCED BANKING SYSTEM DEMO\n');

// Create accounts
const account1 = new BankAccount('ACC-001', 1000);
const account2 = new BankAccount('ACC-002', 500);
const account3 = new BankAccount('ACC-003', 200);

const commandManager = new BankingCommandManager();

// Create a complex composite command (like a payroll processing)
const payrollProcessing = new CompositeCommand('Monthly Payroll Processing');

payrollProcessing
    .addCommand(new DepositCommand(account1, 2000, 'Salary'))
    .addCommand(new DepositCommand(account2, 1500, 'Salary'))
    .addCommand(new DepositCommand(account3, 1800, 'Salary'))
    .addCommand(new WithdrawCommand(account1, 500, 'Rent Payment'))
    .addCommand(new WithdrawCommand(account2, 300, 'Utility Bill'))
    .addCommand(new TransferCommand(account1, account3, 200, 'Loan Repayment'));

console.log('💰 Executing payroll processing...');
try {
    commandManager.executeComposite(payrollProcessing);
    
    console.log('\n📊 Final Balances:');
    console.log(`Account ${account1.accountNumber}: $${account1.balance}`);
    console.log(`Account ${account2.accountNumber}: $${account2.balance}`);
    console.log(`Account ${account3.accountNumber}: $${account3.balance}`);
    
    // Demonstrate undo/redo
    console.log('\n⏪ Testing undo functionality...');
    commandManager.undo(); // Undo the entire composite command
    
    console.log('\n📊 Balances after undo:');
    console.log(`Account ${account1.accountNumber}: $${account1.balance}`);
    console.log(`Account ${account2.accountNumber}: $${account2.balance}`);
    console.log(`Account ${account3.accountNumber}: $${account3.balance}`);
    
    console.log('\n🔁 Testing redo functionality...');
    commandManager.redo();
    
} catch (error) {
    console.error('Payroll processing failed:', error.message);
}

// Show command history
console.log('\n📋 Command History:');
console.log(commandManager.getHistory());

// Example 2: Game Engine with Complex Commands

// Advanced Game Engine Command System
class GameCommand {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.timestamp = Date.now();
    }
    
    execute() {}
    undo() {}
    canExecute() { return true; }
}

// Composite command for game actions
class GameActionSequence extends GameCommand {
    constructor(gameEngine, name) {
        super(gameEngine);
        this.name = name;
        this.actions = [];
        this.currentActionIndex = -1;
    }
    
    addAction(action) {
        this.actions.push(action);
        return this;
    }
    
    execute() {
        console.log(`🎮 Executing game action sequence: ${this.name}`);
        for (let i = 0; i < this.actions.length; i++) {
            if (this.actions[i].canExecute()) {
                this.actions[i].execute();
                this.currentActionIndex = i;
            } else {
                console.log(`❌ Action ${i} cannot be executed, rolling back...`);
                this.undo();
                throw new Error(`Game action sequence failed at action ${i}`);
            }
        }
        return { success: true, actionsExecuted: this.actions.length };
    }
    
    undo() {
        console.log(`⏪ Undoing game action sequence: ${this.name}`);
        for (let i = this.currentActionIndex; i >= 0; i--) {
            this.actions[i].undo();
        }
        this.currentActionIndex = -1;
    }
    
    canExecute() {
        return this.actions.every(action => action.canExecute());
    }
}

// Game Engine
class GameEngine {
    constructor() {
        this.players = new Map();
        this.resources = new Map();
        this.units = new Map();
        this.buildings = new Map();
        this.commandHistory = [];
        this.maxCommandHistory = 50;
    }
    
    addPlayer(player) {
        this.players.set(player.id, player);
    }
    
    addResource(playerId, resourceType, amount) {
        const player = this.players.get(playerId);
        if (!player) throw new Error('Player not found');
        
        if (!player.resources) player.resources = new Map();
        const current = player.resources.get(resourceType) || 0;
        player.resources.set(resourceType, current + amount);
        
        return { playerId, resourceType, amount, newTotal: current + amount };
    }
    
    spendResource(playerId, resourceType, amount) {
        const player = this.players.get(playerId);
        if (!player) throw new Error('Player not found');
        
        const current = player.resources.get(resourceType) || 0;
        if (current < amount) throw new Error('Insufficient resources');
        
        player.resources.set(resourceType, current - amount);
        return { playerId, resourceType, amount, newTotal: current - amount };
    }
    
    createUnit(playerId, unitType, position) {
        const unit = {
            id: Math.random().toString(36).substr(2, 9),
            playerId,
            unitType,
            position,
            health: 100,
            created: Date.now()
        };
        
        this.units.set(unit.id, unit);
        console.log(`🛡️ Created ${unitType} for player ${playerId} at ${position.x},${position.y}`);
        return unit;
    }
    
    removeUnit(unitId) {
        const unit = this.units.get(unitId);
        if (unit) {
            this.units.delete(unitId);
            console.log(`💀 Removed unit ${unitId}`);
            return unit;
        }
        return null;
    }
    
    createBuilding(playerId, buildingType, position) {
        const building = {
            id: Math.random().toString(36).substr(2, 9),
            playerId,
            buildingType,
            position,
            health: 100,
            created: Date.now()
        };
        
        this.buildings.set(building.id, building);
        console.log(`🏰 Created ${buildingType} for player ${playerId} at ${position.x},${position.y}`);
        return building;
    }
    
    damageBuilding(buildingId, damage) {
        const building = this.buildings.get(buildingId);
        if (building) {
            building.health = Math.max(0, building.health - damage);
            console.log(`💥 Damaged building ${buildingId} by ${damage}. Health: ${building.health}`);
            return building;
        }
        return null;
    }
}

// Concrete Game Commands
class GatherResourceCommand extends GameCommand {
    constructor(gameEngine, playerId, resourceType, amount) {
        super(gameEngine);
        this.playerId = playerId;
        this.resourceType = resourceType;
        this.amount = amount;
        this.executionResult = null;
    }
    
    execute() {
        this.executionResult = this.gameEngine.addResource(this.playerId, this.resourceType, this.amount);
        return this.executionResult;
    }
    
    undo() {
        if (this.executionResult) {
            this.gameEngine.spendResource(this.playerId, this.resourceType, this.amount);
            console.log(`↩️ Undid resource gathering: ${this.amount} ${this.resourceType}`);
        }
    }
    
    canExecute() {
        return this.gameEngine.players.has(this.playerId);
    }
}

class TrainUnitCommand extends GameCommand {
    constructor(gameEngine, playerId, unitType, cost, position) {
        super(gameEngine);
        this.playerId = playerId;
        this.unitType = unitType;
        this.cost = cost;
        this.position = position;
        this.unit = null;
        this.resourceSpent = false;
    }
    
    execute() {
        // Spend resources first
        Object.entries(this.cost).forEach(([resource, amount]) => {
            this.gameEngine.spendResource(this.playerId, resource, amount);
        });
        this.resourceSpent = true;
        
        // Create unit
        this.unit = this.gameEngine.createUnit(this.playerId, this.unitType, this.position);
        return this.unit;
    }
    
    undo() {
        if (this.unit) {
            this.gameEngine.removeUnit(this.unit.id);
        }
        if (this.resourceSpent) {
            Object.entries(this.cost).forEach(([resource, amount]) => {
                this.gameEngine.addResource(this.playerId, resource, amount);
            });
        }
        console.log(`↩️ Undid unit training: ${this.unitType}`);
    }
    
    canExecute() {
        const player = this.gameEngine.players.get(this.playerId);
        if (!player) return false;
        
        // Check if player has enough resources
        return Object.entries(this.cost).every(([resource, amount]) => {
            return (player.resources.get(resource) || 0) >= amount;
        });
    }
}

class BuildStructureCommand extends GameCommand {
    constructor(gameEngine, playerId, buildingType, cost, position) {
        super(gameEngine);
        this.playerId = playerId;
        this.buildingType = buildingType;
        this.cost = cost;
        this.position = position;
        this.building = null;
        this.resourceSpent = false;
    }
    
    execute() {
        // Spend resources
        Object.entries(this.cost).forEach(([resource, amount]) => {
            this.gameEngine.spendResource(this.playerId, resource, amount);
        });
        this.resourceSpent = true;
        
        // Create building
        this.building = this.gameEngine.createBuilding(this.playerId, this.buildingType, this.position);
        return this.building;
    }
    
    undo() {
        if (this.building) {
            // In a real game, you might not remove the building but refund resources
            console.log(`↩️ Undid building construction: ${this.buildingType}`);
        }
        if (this.resourceSpent) {
            Object.entries(this.cost).forEach(([resource, amount]) => {
                this.gameEngine.addResource(this.playerId, resource, amount);
            });
        }
    }
    
    canExecute() {
        const player = this.gameEngine.players.get(this.playerId);
        if (!player) return false;
        
        return Object.entries(this.cost).every(([resource, amount]) => {
            return (player.resources.get(resource) || 0) >= amount;
        });
    }
}

// Game Command Manager
class GameCommandManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.commandHistory = [];
        this.futureCommands = [];
    }
    
    execute(command) {
        if (!command.canExecute()) {
            throw new Error('Command cannot be executed');
        }
        
        const result = command.execute();
        this.commandHistory.push(command);
        this.futureCommands = []; // Clear future commands
        
        // Limit history size
        if (this.commandHistory.length > this.gameEngine.maxCommandHistory) {
            this.commandHistory.shift();
        }
        
        return result;
    }
    
    undo() {
        if (this.commandHistory.length > 0) {
            const command = this.commandHistory.pop();
            command.undo();
            this.futureCommands.push(command);
            return command;
        }
        return null;
    }
    
    redo() {
        if (this.futureCommands.length > 0) {
            const command = this.futureCommands.pop();
            this.execute(command);
            return command;
        }
        return null;
    }
}

// Demo the Game System
console.log('\n🎮 ADVANCED GAME ENGINE DEMO\n');

const gameEngine = new GameEngine();
const gameCommandManager = new GameCommandManager(gameEngine);

// Setup players
const player1 = { id: 'player1', resources: new Map([['gold', 1000], ['wood', 500], ['food', 200]]) };
const player2 = { id: 'player2', resources: new Map([['gold', 800], ['wood', 600], ['food', 300]]) };

gameEngine.addPlayer(player1);
gameEngine.addPlayer(player2);

// Create complex game sequence
const earlyGameStrategy = new GameActionSequence(gameEngine, 'Early Game Strategy');

earlyGameStrategy
    .addAction(new GatherResourceCommand(gameEngine, 'player1', 'gold', 200))
    .addAction(new GatherResourceCommand(gameEngine, 'player1', 'wood', 100))
    .addAction(new TrainUnitCommand(gameEngine, 'player1', 'Knight', { gold: 150, food: 50 }, { x: 10, y: 15 }))
    .addAction(new TrainUnitCommand(gameEngine, 'player1', 'Archer', { gold: 100, wood: 50 }, { x: 12, y: 15 }))
    .addAction(new BuildStructureCommand(gameEngine, 'player1', 'Barracks', { gold: 300, wood: 200 }, { x: 15, y: 20 }));

console.log('⚔️ Executing early game strategy...');
try {
    gameCommandManager.execute(earlyGameStrategy);
    
    console.log('\n📊 Player 1 Resources after strategy:');
    console.log('Gold:', player1.resources.get('gold'));
    console.log('Wood:', player1.resources.get('wood'));
    console.log('Food:', player1.resources.get('food'));
    
    console.log('\n🎯 Player 1 Units:', gameEngine.units.size);
    console.log('🏰 Player 1 Buildings:', gameEngine.buildings.size);
    
    // Test undo
    console.log('\n⏪ Testing undo of game strategy...');
    gameCommandManager.undo();
    
    console.log('\n📊 Player 1 Resources after undo:');
    console.log('Gold:', player1.resources.get('gold'));
    console.log('Wood:', player1.resources.get('wood'));
    console.log('Food:', player1.resources.get('food'));
    
} catch (error) {
    console.error('Game strategy failed:', error.message);
}


// Example 3: Distributed System Command Pattern

// Distributed Command System with Async Operations
class DistributedCommand {
    constructor() {
        this.commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.status = 'pending'; // pending, executing, completed, failed
        this.createdAt = new Date();
        this.completedAt = null;
    }
    
    async execute() {}
    async undo() {}
    async validate() { return true; }
    
    serialize() {
        return {
            commandId: this.commandId,
            type: this.constructor.name,
            status: this.status,
            createdAt: this.createdAt,
            completedAt: this.completedAt
        };
    }
    
    static async deserialize(data) {
        // Implementation would create command instances from serialized data
        return new this();
    }
}

// Command Coordinator for Distributed Systems
class DistributedCommandCoordinator {
    constructor() {
        this.pendingCommands = new Map();
        this.completedCommands = new Map();
        this.failedCommands = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000; // ms
    }
    
    async executeCommand(command, nodeId = 'local') {
        try {
            command.status = 'executing';
            this.pendingCommands.set(command.commandId, { command, nodeId });
            
            // Validate command
            if (!(await command.validate())) {
                throw new Error('Command validation failed');
            }
            
            // Execute command
            const result = await command.execute();
            
            command.status = 'completed';
            command.completedAt = new Date();
            this.pendingCommands.delete(command.commandId);
            this.completedCommands.set(command.commandId, { command, nodeId, result });
            
            console.log(`✅ Command ${command.commandId} executed successfully on node ${nodeId}`);
            return result;
            
        } catch (error) {
            command.status = 'failed';
            this.pendingCommands.delete(command.commandId);
            this.failedCommands.set(command.commandId, { command, nodeId, error });
            
            console.error(`❌ Command ${command.commandId} failed: ${error.message}`);
            throw error;
        }
    }
    
    async executeWithRetry(command, nodeId = 'local', attempts = this.retryAttempts) {
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                return await this.executeCommand(command, nodeId);
            } catch (error) {
                if (attempt === attempts) {
                    throw error;
                }
                console.log(`🔄 Retry attempt ${attempt + 1}/${attempts} for command ${command.commandId}`);
                await this.delay(this.retryDelay * attempt);
            }
        }
    }
    
    async executeOnMultipleNodes(command, nodeIds) {
        const results = [];
        
        for (const nodeId of nodeIds) {
            try {
                // Clone command for each node
                const nodeCommand = Object.assign(Object.create(Object.getPrototypeOf(command)), command);
                nodeCommand.commandId = `${command.commandId}_${nodeId}`;
                
                const result = await this.executeWithRetry(nodeCommand, nodeId);
                results.push({ nodeId, success: true, result });
            } catch (error) {
                results.push({ nodeId, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getCommandStatus(commandId) {
        if (this.pendingCommands.has(commandId)) {
            return 'pending';
        } else if (this.completedCommands.has(commandId)) {
            return 'completed';
        } else if (this.failedCommands.has(commandId)) {
            return 'failed';
        }
        return 'unknown';
    }
    
    async rollbackCommand(commandId) {
        const failedEntry = this.failedCommands.get(commandId);
        if (failedEntry) {
            try {
                await failedEntry.command.undo();
                this.failedCommands.delete(commandId);
                console.log(`↩️ Rolled back failed command ${commandId}`);
            } catch (error) {
                console.error(`❌ Failed to rollback command ${commandId}: ${error.message}`);
            }
        }
    }
}

// Example Distributed Commands
class DatabaseUpdateCommand extends DistributedCommand {
    constructor(database, table, recordId, updates) {
        super();
        this.database = database;
        this.table = table;
        this.recordId = recordId;
        this.updates = updates;
        this.previousState = null;
    }
    
    async execute() {
        // Simulate database operation
        console.log(`🗃️ Updating ${this.table} record ${this.recordId}`);
        
        // Store previous state for undo
        this.previousState = await this.simulateGetRecord(this.table, this.recordId);
        
        // Apply updates
        await this.simulateUpdateRecord(this.table, this.recordId, this.updates);
        
        return { table: this.table, recordId: this.recordId, updates: this.updates };
    }
    
    async undo() {
        if (this.previousState) {
            console.log(`↩️ Reverting ${this.table} record ${this.recordId}`);
            await this.simulateUpdateRecord(this.table, this.recordId, this.previousState);
        }
    }
    
    async validate() {
        // Validate that the record exists
        const record = await this.simulateGetRecord(this.table, this.recordId);
        return record !== null;
    }
    
    async simulateGetRecord(table, id) {
        await this.delay(100); // Simulate network delay
        return { id, name: 'Existing Record', value: 42 };
    }
    
    async simulateUpdateRecord(table, id, updates) {
        await this.delay(200); // Simulate database write
        return { id, ...updates, updatedAt: new Date() };
    }
}

class CacheInvalidationCommand extends DistributedCommand {
    constructor(cacheService, keys) {
        super();
        this.cacheService = cacheService;
        this.keys = keys;
        this.cachedValues = new Map();
    }
    
    async execute() {
        console.log(`🗑️ Invalidating cache keys: ${this.keys.join(', ')}`);
        
        // Store current values for undo
        for (const key of this.keys) {
            const value = await this.cacheService.get(key);
            if (value !== null) {
                this.cachedValues.set(key, value);
            }
        }
        
        // Invalidate cache
        await this.cacheService.invalidate(this.keys);
        
        return { invalidatedKeys: this.keys, storedValues: Array.from(this.cachedValues.entries()) };
    }
    
    async undo() {
        console.log(`🔄 Restoring cache values for ${this.cachedValues.size} keys`);
        
        for (const [key, value] of this.cachedValues) {
            await this.cacheService.set(key, value);
        }
    }
}

// Demo Distributed System
console.log('\n🌐 DISTRIBUTED COMMAND SYSTEM DEMO\n');

class MockDatabase {
    constructor() {
        this.data = new Map();
    }
    
    async get(key) {
        await new Promise(resolve => setTimeout(resolve, 50));
        return this.data.get(key) || null;
    }
    
    async set(key, value) {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.data.set(key, value);
        return true;
    }
}

class MockCacheService {
    constructor() {
        this.cache = new Map();
    }
    
    async get(key) {
        await new Promise(resolve => setTimeout(resolve, 10));
        return this.cache.get(key) || null;
    }
    
    async set(key, value) {
        await new Promise(resolve => setTimeout(resolve, 20));
        this.cache.set(key, value);
        return true;
    }
    
    async invalidate(keys) {
        await new Promise(resolve => setTimeout(resolve, 30));
        keys.forEach(key => this.cache.delete(key));
        return true;
    }
}

const database = new MockDatabase();
const cacheService = new MockCacheService();
const coordinator = new DistributedCommandCoordinator();

// Setup some initial data
await database.set('users:1', { id: 1, name: 'John Doe', email: 'john@example.com' });
await cacheService.set('user:1:profile', { name: 'John Doe', lastLogin: new Date() });

// Create distributed commands
const dbUpdateCommand = new DatabaseUpdateCommand(
    database, 
    'users', 
    '1', 
    { email: 'john.doe@newexample.com', updatedAt: new Date() }
);

const cacheInvalidationCommand = new CacheInvalidationCommand(
    cacheService,
    ['user:1:profile', 'user:1:settings']
);

// Execute commands across different nodes
console.log('🚀 Executing distributed commands...');

try {
    // Execute database update on primary node
    const dbResult = await coordinator.executeWithRetry(dbUpdateCommand, 'database-primary');
    console.log('Database update result:', dbResult);
    
    // Execute cache invalidation on multiple cache nodes
    const cacheResults = await coordinator.executeOnMultipleNodes(
        cacheInvalidationCommand,
        ['cache-node-1', 'cache-node-2', 'cache-node-3']
    );
    
    console.log('Cache invalidation results:');
    cacheResults.forEach(result => {
        console.log(`  ${result.nodeId}: ${result.success ? '✅ Success' : '❌ Failed'}`);
    });
    
    // Check command status
    console.log('\n📊 Command Status:');
    console.log(`DB Update: ${coordinator.getCommandStatus(dbUpdateCommand.commandId)}`);
    console.log(`Cache Invalidation: ${coordinator.getCommandStatus(cacheInvalidationCommand.commandId)}`);
    
} catch (error) {
    console.error('Distributed command execution failed:', error);
    
    // Attempt to rollback failed commands
    console.log('\n🔄 Attempting rollback...');
    await coordinator.rollbackCommand(dbUpdateCommand.commandId);
}
