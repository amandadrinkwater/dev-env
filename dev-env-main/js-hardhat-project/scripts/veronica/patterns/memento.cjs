/*

         Key Benefits in Real-World Usage:
Undo/Redo Functionality - Essential for text editors, graphic apps, etc.

State Persistence - Save/load game progress, form data

Transactional Operations - Rollback failed operations

Snapshot Debugging - Capture application state for debugging

Configuration Management - Rollback system settings

The Memento Pattern is particularly useful when you need to implement features like:

Undo/redo operations

Save/load functionality

State rollback mechanisms

Version control for object states

This pattern helps maintain clean separation of concerns while providing powerful state management capabilities!

These advanced examples demonstrate:

Distributed Systems: Snapshot management with compression, encryption, and replication

Collaborative Editing: Operational transform for real-time collaboration

Financial Systems: Transaction rollback with complex risk management

AI Training: Sophisticated checkpoint strategies for model training

Each implementation handles complex scenarios like conflict resolution, data integrity, performance optimization, and distributed state management.


*/

// Memento - stores the state
class EditorMemento {
    constructor(content) {
        this._content = content;
        this._timestamp = new Date();
    }

    getContent() {
        return this._content;
    }

    getTimestamp() {
        return this._timestamp;
    }
}

// Originator - creates and restores mementos
class TextEditor {
    constructor() {
        this._content = "";
        this._cursorPosition = 0;
    }

    type(text) {
        this._content += text;
        this._cursorPosition = this._content.length;
    }

    backspace() {
        if (this._content.length > 0) {
            this._content = this._content.slice(0, -1);
            this._cursorPosition = Math.max(0, this._cursorPosition - 1);
        }
    }

    setCursor(position) {
        this._cursorPosition = Math.max(0, Math.min(position, this._content.length));
    }

    // Creates a memento containing current state
    save() {
        return new EditorMemento(this._content, this._cursorPosition);
    }

    // Restores state from a memento
    restore(memento) {
        this._content = memento.getContent();
        // Note: In a real implementation, we'd also save cursor position
    }

    getContent() {
        return this._content;
    }

    getCursorPosition() {
        return this._cursorPosition;
    }
}

// Caretaker - manages mementos
class History {
    constructor() {
        this._mementos = [];
        this._currentIndex = -1;
    }

    push(memento) {
        // Remove any future states if we're branching from history
        this._mementos = this._mementos.slice(0, this._currentIndex + 1);
        this._mementos.push(memento);
        this._currentIndex = this._mementos.length - 1;
    }

    undo() {
        if (this._currentIndex > 0) {
            this._currentIndex--;
            return this._mementos[this._currentIndex];
        }
        return null;
    }

    redo() {
        if (this._currentIndex < this._mementos.length - 1) {
            this._currentIndex++;
            return this._mementos[this._currentIndex];
        }
        return null;
    }

    canUndo() {
        return this._currentIndex > 0;
    }

    canRedo() {
        return this._currentIndex < this._mementos.length - 1;
    }
}

// Usage
const editor = new TextEditor();
const history = new History();

// Initial state
editor.type("Hello");
history.push(editor.save());

editor.type(" World");
history.push(editor.save());

editor.type("!");
history.push(editor.save());

console.log("Current content:", editor.getContent()); // "Hello World!"

// Undo
const previousState = history.undo();
if (previousState) {
    editor.restore(previousState);
    console.log("After undo:", editor.getContent()); // "Hello World"
}

// Redo
const nextState = history.redo();
if (nextState) {
    editor.restore(nextState);
    console.log("After redo:", editor.getContent()); // "Hello World!"
}

// Enhanced Example: Game Save System

// Memento for game state
class GameSave {
    constructor(level, score, playerHealth, inventory) {
        this.level = level;
        this.score = score;
        this.playerHealth = playerHealth;
        this.inventory = [...inventory]; // Create a copy
        this.timestamp = new Date();
    }
}

// Game character (Originator)
class GameCharacter {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.health = 100;
        this.inventory = [];
    }

    levelUp() {
        this.level++;
        this.health = 100; // Full health on level up
        console.log(`Level up! Now at level ${this.level}`);
    }

    addScore(points) {
        this.score += points;
        console.log(`Score: ${this.score}`);
    }

    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        console.log(`Health: ${this.health}`);
    }

    addItem(item) {
        this.inventory.push(item);
        console.log(`Added ${item} to inventory`);
    }

    // Create memento
    saveGame() {
        return new GameSave(this.level, this.score, this.health, this.inventory);
    }

    // Restore from memento
    loadGame(save) {
        this.level = save.level;
        this.score = save.score;
        this.health = save.playerHealth;
        this.inventory = [...save.inventory];
        console.log(`Game loaded from ${save.timestamp.toLocaleTimeString()}`);
    }

    displayStatus() {
        console.log(`Level: ${this.level}, Score: ${this.score}, Health: ${this.health}, Inventory: [${this.inventory.join(', ')}]`);
    }
}

// Save Manager (Caretaker)
class SaveManager {
    constructor() {
        this.saves = new Map(); // Multiple save slots
    }

    saveGame(slotName, character) {
        this.saves.set(slotName, character.saveGame());
        console.log(`Game saved in slot: ${slotName}`);
    }

    loadGame(slotName, character) {
        const save = this.saves.get(slotName);
        if (save) {
            character.loadGame(save);
            return true;
        }
        console.log(`No save found in slot: ${slotName}`);
        return false;
    }

    listSaves() {
        console.log("Available saves:");
        this.saves.forEach((save, slot) => {
            console.log(`- ${slot}: Level ${save.level}, Score ${save.score} (${save.timestamp.toLocaleString()})`);
        });
    }
}

// Usage
const player = new GameCharacter();
const saveManager = new SaveManager();

// Play the game
player.addScore(100);
player.addItem("Sword");
player.levelUp();
player.addScore(50);
player.addItem("Potion");
player.takeDamage(20);

player.displayStatus();
// Save current progress
saveManager.saveGame("slot1", player);

// Continue playing
player.addScore(200);
player.levelUp();
player.takeDamage(40);
player.displayStatus();

// Oops, made a mistake! Load previous save
console.log("\n--- Loading previous save ---");
saveManager.loadGame("slot1", player);
player.displayStatus();

saveManager.listSaves();

// Real-World Usage Examples
// 1. Web Applications

// Form state persistence
class FormStateMemento {
    constructor(formData, validationState, focusedField) {
        this.formData = { ...formData };
        this.validationState = { ...validationState };
        this.focusedField = focusedField;
    }
}

class ComplexForm {
    constructor() {
        this.state = {
            values: {},
            errors: {},
            touched: {}
        };
        this.history = [];
    }

    saveState() {
        this.history.push(new FormStateMemento(
            this.state.values,
            this.state.errors,
            this.state.focusedField
        ));
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
        }
    }

    restoreState() {
        if (this.history.length > 0) {
            const memento = this.history.pop();
            this.state.values = memento.formData;
            this.state.errors = memento.validationState;
            this.state.focusedField = memento.focusedField;
        }
    }
}

// 2. Drawing/Canvas Applications

// Drawing application with undo/redo
class CanvasState {
    constructor(shapes, selectedTool, brushColor) {
        this.shapes = JSON.parse(JSON.stringify(shapes)); // Deep clone
        this.selectedTool = selectedTool;
        this.brushColor = brushColor;
    }
}

class DrawingApp {
    constructor() {
        this.shapes = [];
        this.history = [];
        this.future = []; // For redo functionality
    }

    addShape(shape) {
        this.history.push(new CanvasState(this.shapes, this.selectedTool, this.brushColor));
        this.future = []; // Clear redo stack
        this.shapes.push(shape);
    }

    undo() {
        if (this.history.length > 0) {
            this.future.push(new CanvasState(this.shapes, this.selectedTool, this.brushColor));
            const previous = this.history.pop();
            this.shapes = previous.shapes;
            this.selectedTool = previous.selectedTool;
            this.brushColor = previous.brushColor;
        }
    }

    redo() {
        if (this.future.length > 0) {
            this.history.push(new CanvasState(this.shapes, this.selectedTool, this.brushColor));
            const next = this.future.pop();
            this.shapes = next.shapes;
            this.selectedTool = next.selectedTool;
            this.brushColor = next.brushColor;
        }
    }
}

// 3 Configuration Management

// System configuration with rollback capability
class ConfigMemento {
    constructor(config) {
        this.config = JSON.parse(JSON.stringify(config));
        this.timestamp = new Date();
    }
}

class SystemConfig {
    constructor() {
        this.settings = {
            theme: 'light',
            language: 'en',
            notifications: true,
            timeout: 30000
        };
        this.backups = [];
    }

    updateSetting(key, value) {
        this.backups.push(new ConfigMemento(this.settings));
        this.settings[key] = value;
        console.log(`Setting updated: ${key} = ${value}`);
    }

    rollback() {
        if (this.backups.length > 0) {
            const backup = this.backups.pop();
            this.settings = backup.config;
            console.log(`Configuration rolled back to ${backup.timestamp.toLocaleString()}`);
        }
    }
}

// 1. Distributed System State Management

// Advanced Memento with compression and encryption
class DistributedMemento {
    constructor(state, metadata = {}) {
        this._id = this.generateUUID();
        this._timestamp = new Date();
        this._version = metadata.version || '1.0';
        this._checksum = this.calculateChecksum(state);
        this._compressedState = this.compressState(state);
        this._encrypted = metadata.encrypt ? this.encrypt(this._compressedState) : this._compressedState;
        this._metadata = metadata;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    calculateChecksum(state) {
        // Simple checksum - in real world use crypto library
        const str = JSON.stringify(state);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    compressState(state) {
        // Simple compression - remove whitespace from JSON
        return JSON.stringify(state).replace(/\s+/g, '');
    }

    encrypt(data) {
        // Mock encryption - in real world use Web Crypto API
        return btoa(data).split('').reverse().join('');
    }

    decrypt(data) {
        return atob(data.split('').reverse().join(''));
    }

    getState() {
        const decompressed = this._metadata.encrypt ? 
            this.decrypt(this._encrypted) : this._encrypted;
        return JSON.parse(decompressed);
    }

    validate() {
        const state = this.getState();
        return this.calculateChecksum(state) === this._checksum;
    }

    getMetadata() {
        return {
            id: this._id,
            timestamp: this._timestamp,
            version: this._version,
            checksum: this._checksum,
            ...this._metadata
        };
    }
}

// Distributed Service with State Management
class Microservice {
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.state = {
            connections: new Map(),
            cache: new Map(),
            metrics: {
                requests: 0,
                errors: 0,
                uptime: Date.now()
            },
            configuration: {}
        };
        this.snapshotManager = new DistributedSnapshotManager();
        this.replicationManager = new ReplicationManager(this);
    }

    async takeSnapshot(metadata = {}) {
        const snapshot = new DistributedMemento(this.state, {
            service: this.serviceName,
            version: '1.0',
            encrypt: true,
            ...metadata
        });

        await this.snapshotManager.storeSnapshot(snapshot);
        return snapshot;
    }

    async restoreFromSnapshot(snapshotId) {
        const snapshot = await this.snapshotManager.getSnapshot(snapshotId);
        
        if (!snapshot.validate()) {
            throw new Error('Snapshot validation failed');
        }

        this.state = snapshot.getState();
        console.log(`Service ${this.serviceName} restored from snapshot ${snapshotId}`);
    }

    async replicateStateTo(peerService) {
        const snapshot = await this.takeSnapshot({ replication: true });
        await this.replicationManager.replicate(snapshot, peerService);
    }
}

class DistributedSnapshotManager {
    constructor() {
        this.snapshots = new Map();
        this.storageAdapters = {
            local: new LocalStorageAdapter(),
            remote: new RemoteStorageAdapter()
        };
    }

    async storeSnapshot(snapshot, storageType = 'local') {
        const adapter = this.storageAdapters[storageType];
        await adapter.store(snapshot);
        this.snapshots.set(snapshot.getMetadata().id, snapshot);
        
        // Automatic cleanup - keep only last 10 snapshots
        if (this.snapshots.size > 10) {
            const oldest = Array.from(this.snapshots.values())
                .sort((a, b) => a.getMetadata().timestamp - b.getMetadata().timestamp)[0];
            this.snapshots.delete(oldest.getMetadata().id);
        }
    }

    async getSnapshot(snapshotId) {
        if (this.snapshots.has(snapshotId)) {
            return this.snapshots.get(snapshotId);
        }
        
        // Try to load from storage
        for (const adapter of Object.values(this.storageAdapters)) {
            const snapshot = await adapter.retrieve(snapshotId);
            if (snapshot) {
                this.snapshots.set(snapshotId, snapshot);
                return snapshot;
            }
        }
        
        throw new Error(`Snapshot ${snapshotId} not found`);
    }
}

class ReplicationManager {
    constructor(service) {
        this.service = service;
        this.peers = new Set();
    }

    async replicate(snapshot, peerService) {
        try {
            // Simulate network replication
            await this.sendToPeer(peerService, snapshot);
            console.log(`State replicated from ${this.service.serviceName} to ${peerService.serviceName}`);
        } catch (error) {
            console.error(`Replication failed: ${error.message}`);
            throw error;
        }
    }

    async sendToPeer(peer, snapshot) {
        // Mock network call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate
                    resolve();
                } else {
                    reject(new Error('Network error'));
                }
            }, 100);
        });
    }
}

// Storage Adapters
class LocalStorageAdapter {
    async store(snapshot) {
        const key = `snapshot_${snapshot.getMetadata().id}`;
        localStorage.setItem(key, JSON.stringify({
            metadata: snapshot.getMetadata(),
            data: snapshot._encrypted
        }));
    }

    async retrieve(snapshotId) {
        const key = `snapshot_${snapshotId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            const { metadata, data } = JSON.parse(stored);
            // Reconstruct memento (simplified)
            const memento = Object.create(DistributedMemento.prototype);
            Object.assign(memento, { _encrypted: data, _metadata: metadata });
            return memento;
        }
        return null;
    }
}

class RemoteStorageAdapter {
    async store(snapshot) {
        // Mock remote storage
        console.log(`Storing snapshot ${snapshot.getMetadata().id} to remote storage`);
    }

    async retrieve(snapshotId) {
        // Mock remote retrieval
        return null;
    }
}

// 2. Real-Time Collaborative Editor with Operational Transform

class CollaborativeMemento {
    constructor(documentState, operations = []) {
        this.documentState = JSON.parse(JSON.stringify(documentState));
        this.operations = operations.map(op => ({ ...op }));
        this.version = operations.length;
        this.timestamp = new Date();
        this.author = documentState.currentUser;
    }

    transformOperation(operation, against) {
        // Simplified Operational Transform
        // In real world, this would handle cursor positions, conflicts, etc.
        if (operation.type === 'insert' && against.type === 'insert') {
            if (operation.position < against.position) {
                return operation;
            } else {
                return {
                    ...operation,
                    position: operation.position + against.content.length
                };
            }
        }
        return operation;
    }

    rebase(newerMemento) {
        const rebasedOperations = [];
        
        for (const op of this.operations) {
            let transformedOp = { ...op };
            for (const newOp of newerMemento.operations) {
                transformedOp = this.transformOperation(transformedOp, newOp);
            }
            rebasedOperations.push(transformedOp);
        }

        return new CollaborativeMemento(
            newerMemento.documentState,
            [...newerMemento.operations, ...rebasedOperations]
        );
    }
}

class CollaborativeDocument {
    constructor() {
        this.state = {
            content: '',
            users: new Map(),
            selections: new Map(),
            revision: 0
        };
        this.operationHistory = [];
        this.pendingOperations = [];
        this.conflictResolver = new ConflictResolver();
    }

    applyOperation(operation) {
        const transformedOps = this.conflictResolver.transform(
            operation,
            this.pendingOperations
        );

        for (const op of transformedOps) {
            this.executeOperation(op);
            this.operationHistory.push(op);
        }

        this.state.revision++;
    }

    executeOperation(operation) {
        switch (operation.type) {
            case 'insert':
                this.state.content = 
                    this.state.content.slice(0, operation.position) +
                    operation.content +
                    this.state.content.slice(operation.position);
                break;
            case 'delete':
                this.state.content = 
                    this.state.content.slice(0, operation.position) +
                    this.state.content.slice(operation.position + operation.length);
                break;
            case 'format':
                // Handle text formatting
                break;
        }
    }

    createSnapshot() {
        return new CollaborativeMemento(this.state, this.operationHistory);
    }

    restoreFromSnapshot(memento) {
        this.state = JSON.parse(JSON.stringify(memento.documentState));
        this.operationHistory = memento.operations.map(op => ({ ...op }));
        this.state.revision = memento.version;
    }

    mergeSnapshot(remoteMemento) {
        const localSnapshot = this.createSnapshot();
        const merged = localSnapshot.rebase(remoteMemento);
        this.restoreFromSnapshot(merged);
    }

    getContent() {
        return this.state.content;
    }

    getRevision() {
        return this.state.revision;
    }
}

class ConflictResolver {
    transform(operation, pendingOperations) {
        let transformedOp = operation;
        
        for (const pendingOp of pendingOperations) {
            transformedOp = this.transformOperation(transformedOp, pendingOp);
        }
        
        return [transformedOp];
    }

    transformOperation(op1, op2) {
        // Advanced operational transform logic
        if (op1.type === 'insert' && op2.type === 'insert') {
            return this.transformInsertInsert(op1, op2);
        } else if (op1.type === 'insert' && op2.type === 'delete') {
            return this.transformInsertDelete(op1, op2);
        }
        return op1;
    }

    transformInsertInsert(op1, op2) {
        if (op1.position < op2.position) {
            return op1;
        } else if (op1.position > op2.position) {
            return {
                ...op1,
                position: op1.position + op2.content.length
            };
        } else {
            // Same position - order by timestamp or user priority
            return op1.timestamp < op2.timestamp ? op1 : {
                ...op1,
                position: op1.position + op2.content.length
            };
        }
    }

    transformInsertDelete(op1, op2) {
        if (op1.position <= op2.position) {
            return op1;
        } else if (op1.position > op2.position + op2.length) {
            return {
                ...op1,
                position: op1.position - op2.length
            };
        } else {
            // Insertion within deletion range
            return {
                ...op1,
                position: op2.position
            };
        }
    }
}

// 3. Financial Trading System with Transaction Rollback

class TradingMemento {
    constructor(portfolio, orders, marketData, executionId) {
        this.portfolio = this.deepClone(portfolio);
        this.orders = new Map(orders);
        this.marketData = new Map(marketData);
        this.executionId = executionId;
        this.timestamp = new Date();
        this.checksum = this.calculateChecksum();
    }

    deepClone(obj) {
        if (obj instanceof Map) {
            return new Map(Array.from(obj, ([key, val]) => [key, this.deepClone(val)]));
        } else if (obj instanceof Set) {
            return new Set(Array.from(obj, val => this.deepClone(val)));
        } else if (obj instanceof Date) {
            return new Date(obj);
        } else if (obj instanceof RegExp) {
            return new RegExp(obj);
        } else if (obj instanceof Array) {
            return obj.map(val => this.deepClone(val));
        } else if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        } else {
            return obj;
        }
    }

    calculateChecksum() {
        // Complex checksum for financial data integrity
        const data = JSON.stringify({
            portfolio: Array.from(this.portfolio.entries()),
            orders: Array.from(this.orders.entries()),
            marketData: Array.from(this.marketData.entries())
        });
        
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    validate() {
        return this.calculateChecksum() === this.checksum;
    }
}

class TradingEngine {
    constructor() {
        this.portfolio = new Map(); // symbol -> {quantity, averagePrice}
        this.pendingOrders = new Map();
        this.executedOrders = new Map();
        this.marketData = new Map();
        this.transactionLog = [];
        this.riskManager = new RiskManager();
        this.auditLogger = new AuditLogger();
    }

    async executeTrade(order) {
        const preTradeState = this.createSnapshot(`pre-trade-${order.id}`);
        
        try {
            // Phase 1: Validation
            await this.validateOrder(order);
            
            // Phase 2: Risk Check
            const riskCheck = await this.riskManager.checkOrder(order, this.portfolio);
            if (!riskCheck.approved) {
                throw new Error(`Risk check failed: ${riskCheck.reason}`);
            }

            // Phase 3: Market Execution
            const execution = await this.executeMarketOrder(order);
            
            // Phase 4: Portfolio Update
            await this.updatePortfolio(execution);
            
            // Phase 5: Finalize
            await this.finalizeTrade(order, execution);
            
            this.auditLogger.logSuccess(order, execution);
            return execution;
            
        } catch (error) {
            // Rollback on any failure
            await this.rollback(preTradeState, order, error);
            throw error;
        }
    }

    async executeMarketOrder(order) {
        // Simulate market execution with slippage, partial fills, etc.
        const currentPrice = this.marketData.get(order.symbol)?.bid || 0;
        const slippage = order.quantity > 1000 ? currentPrice * 0.001 : 0; // 0.1% slippage for large orders
        
        return {
            id: this.generateExecutionId(),
            orderId: order.id,
            symbol: order.symbol,
            executedQuantity: order.quantity,
            executedPrice: currentPrice - slippage,
            timestamp: new Date(),
            fees: this.calculateFees(order.quantity, currentPrice)
        };
    }

    async updatePortfolio(execution) {
        const current = this.portfolio.get(execution.symbol) || { quantity: 0, averagePrice: 0 };
        
        const newQuantity = current.quantity + execution.executedQuantity;
        const newAveragePrice = current.quantity === 0 ? 
            execution.executedPrice :
            (current.quantity * current.averagePrice + 
             execution.executedQuantity * execution.executedPrice) / newQuantity;
        
        this.portfolio.set(execution.symbol, {
            quantity: newQuantity,
            averagePrice: newAveragePrice
        });
    }

    createSnapshot(context) {
        const memento = new TradingMemento(
            this.portfolio,
            this.pendingOrders,
            this.marketData,
            context
        );
        
        this.transactionLog.push(memento);
        
        // Keep only last 100 snapshots for memory management
        if (this.transactionLog.length > 100) {
            this.transactionLog.shift();
        }
        
        return memento;
    }

    async rollback(snapshot, failedOrder, error) {
        console.log(`Rolling back trade ${failedOrder.id} due to: ${error.message}`);
        
        if (!snapshot.validate()) {
            throw new Error('Snapshot validation failed during rollback');
        }

        // Restore state from snapshot
        this.portfolio = snapshot.deepClone(snapshot.portfolio);
        this.pendingOrders = new Map(snapshot.orders);
        this.marketData = new Map(snapshot.marketData);

        this.auditLogger.logRollback(failedOrder, error, snapshot);
    }

    async restoreToPointInTime(timestamp) {
        // Find the closest snapshot before the timestamp
        const snapshot = this.transactionLog
            .filter(s => s.timestamp <= timestamp)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (snapshot) {
            await this.rollback(snapshot, { id: 'time-travel' }, 
                new Error(`Restoring to ${timestamp}`));
            return true;
        }
        return false;
    }

    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateFees(quantity, price) {
        return quantity * price * 0.001; // 0.1% fee
    }
}

class RiskManager {
    async checkOrder(order, portfolio) {
        // Complex risk checks
        const checks = [
            this.checkPositionLimit(order, portfolio),
            this.checkConcentrationRisk(order, portfolio),
            this.checkMarketHours(order),
            this.checkVolatility(order)
        ];

        const results = await Promise.all(checks);
        const failures = results.filter(result => !result.approved);

        if (failures.length > 0) {
            return {
                approved: false,
                reason: failures.map(f => f.reason).join('; ')
            };
        }

        return { approved: true };
    }

    async checkPositionLimit(order, portfolio) {
        const currentPosition = portfolio.get(order.symbol)?.quantity || 0;
        const newPosition = currentPosition + order.quantity;
        
        // Assume position limit of 10,000 shares
        if (Math.abs(newPosition) > 10000) {
            return { approved: false, reason: 'Position limit exceeded' };
        }
        
        return { approved: true };
    }

    async checkConcentrationRisk(order, portfolio) {
        // Simplified concentration check
        const totalValue = Array.from(portfolio.values())
            .reduce((sum, position) => sum + position.quantity * position.averagePrice, 0);
        
        const orderValue = order.quantity * (this.getCurrentPrice(order.symbol) || 0);
        
        if (orderValue > totalValue * 0.1) { // No single order > 10% of portfolio
            return { approved: false, reason: 'Concentration risk' };
        }
        
        return { approved: true };
    }

    getCurrentPrice(symbol) {
        // Mock current price
        return 100;
    }

    checkMarketHours(order) {
        const now = new Date();
        const hour = now.getHours();
        
        // Mock market hours check
        if (hour < 9 || hour >= 16) {
            return { approved: false, reason: 'Outside market hours' };
        }
        
        return { approved: true };
    }

    checkVolatility(order) {
        // Mock volatility check
        return { approved: true };
    }
}

class AuditLogger {
    logSuccess(order, execution) {
        console.log(`SUCCESS: Order ${order.id} executed at ${execution.executedPrice}`);
    }

    logRollback(order, error, snapshot) {
        console.log(`ROLLBACK: Order ${order.id} - ${error.message} - Restored to ${snapshot.timestamp}`);
    }
}

// 4. AI Model Training Checkpoint System

class ModelCheckpoint {
    constructor(modelState, trainingMetrics, hyperparameters, epoch) {
        this.modelState = this.serializeModelState(modelState);
        this.trainingMetrics = { ...trainingMetrics };
        this.hyperparameters = { ...hyperparameters };
        this.epoch = epoch;
        this.timestamp = new Date();
        this.validationScore = trainingMetrics.validationScore || 0;
    }

    serializeModelState(modelState) {
        // In real world, this would handle TensorFlow.js or PyTorch model serialization
        return JSON.stringify(modelState, (key, value) => {
            if (value instanceof Float32Array) {
                return { type: 'Float32Array', data: Array.from(value) };
            }
            return value;
        });
    }

    deserializeModelState() {
        return JSON.parse(this.modelState, (key, value) => {
            if (value && value.type === 'Float32Array') {
                return new Float32Array(value.data);
            }
            return value;
        });
    }

    getScore() {
        return this.validationScore;
    }

    compare(otherCheckpoint) {
        return this.validationScore - otherCheckpoint.validationScore;
    }
}

class TrainingManager {
    constructor() {
        this.checkpoints = [];
        this.bestCheckpoint = null;
        this.patience = 5; // Early stopping patience
        this.checkpointStrategy = new CheckpointStrategy();
    }

    async saveCheckpoint(model, metrics, hyperparameters, epoch) {
        const checkpoint = new ModelCheckpoint(
            model.getState(),
            metrics,
            hyperparameters,
            epoch
        );

        this.checkpoints.push(checkpoint);

        // Update best checkpoint
        if (!this.bestCheckpoint || 
            checkpoint.compare(this.bestCheckpoint) > 0) {
            this.bestCheckpoint = checkpoint;
        }

        // Apply checkpoint strategy
        await this.checkpointStrategy.apply(this, checkpoint);

        return checkpoint;
    }

    async restoreCheckpoint(checkpoint) {
        const modelState = checkpoint.deserializeModelState();
        // In real implementation, this would restore the actual model
        console.log(`Restored model from epoch ${checkpoint.epoch} with score ${checkpoint.validationScore}`);
        return modelState;
    }

    async restoreBestCheckpoint() {
        if (this.bestCheckpoint) {
            return await this.restoreCheckpoint(this.bestCheckpoint);
        }
        throw new Error('No best checkpoint available');
    }

    getCheckpointsByScore() {
        return [...this.checkpoints].sort((a, b) => b.compare(a));
    }

    async pruneCheckpoints(keepTopK = 3) {
        const sorted = this.getCheckpointsByScore();
        const toKeep = sorted.slice(0, keepTopK);
        
        this.checkpoints = toKeep;
        
        // Update best checkpoint
        this.bestCheckpoint = toKeep[0] || null;
    }
}

class CheckpointStrategy {
    constructor() {
        this.strategies = {
            'best-only': this.bestOnlyStrategy.bind(this),
            'frequency-based': this.frequencyBasedStrategy.bind(this),
            'metric-improvement': this.metricImprovementStrategy.bind(this)
        };
    }

    async apply(trainingManager, checkpoint) {
        const strategy = trainingManager.hyperparameters?.checkpointStrategy || 'best-only';
        const strategyFn = this.strategies[strategy];
        
        if (strategyFn) {
            await strategyFn(trainingManager, checkpoint);
        }
    }

    async bestOnlyStrategy(trainingManager, checkpoint) {
        // Only keep checkpoints that are better than previous best
        if (trainingManager.bestCheckpoint === checkpoint) {
            // Remove all other checkpoints
            trainingManager.checkpoints = [checkpoint];
        }
    }

    async frequencyBasedStrategy(trainingManager, checkpoint) {
        const frequency = trainingManager.hyperparameters?.checkpointFrequency || 10;
        
        // Only keep every Nth checkpoint
        if (checkpoint.epoch % frequency !== 0 && 
            trainingManager.bestCheckpoint !== checkpoint) {
            trainingManager.checkpoints = trainingManager.checkpoints
                .filter(cp => cp !== checkpoint);
        }
    }

    async metricImprovementStrategy(trainingManager, checkpoint) {
        const minImprovement = trainingManager.hyperparameters?.minImprovement || 0.01;
        
        // Only keep if improvement is significant
        const previousBest = trainingManager.bestCheckpoint;
        if (previousBest && previousBest !== checkpoint) {
            const improvement = checkpoint.getScore() - previousBest.getScore();
            if (improvement < minImprovement) {
                trainingManager.checkpoints = trainingManager.checkpoints
                    .filter(cp => cp !== checkpoint);
            }
        }
    }
}

// Usage Example for AI Training
class NeuralNetwork {
    constructor() {
        this.layers = [];
        this.weights = new Map();
    }

    getState() {
        return {
            layers: [...this.layers],
            weights: Array.from(this.weights.entries())
        };
    }

    setState(state) {
        this.layers = [...state.layers];
        this.weights = new Map(state.weights);
    }

    async train() {
        const trainingManager = new TrainingManager();
        const hyperparameters = {
            learningRate: 0.001,
            checkpointStrategy: 'metric-improvement',
            minImprovement: 0.001
        };

        for (let epoch = 0; epoch < 100; epoch++) {
            // Simulate training
            const metrics = await this.trainEpoch(epoch);
            
            // Save checkpoint
            await trainingManager.saveCheckpoint(
                this, 
                metrics, 
                hyperparameters, 
                epoch
            );

            // Check for early stopping
            if (await this.shouldEarlyStop(trainingManager)) {
                console.log(`Early stopping at epoch ${epoch}`);
                await trainingManager.restoreBestCheckpoint();
                break;
            }
        }
    }

    async trainEpoch(epoch) {
        // Simulate training
        const loss = Math.max(0.1, 1.0 / (epoch + 1));
        const accuracy = Math.min(0.95, 0.5 + epoch * 0.005);
        const validationScore = accuracy - loss * 0.1;

        return {
            loss,
            accuracy,
            validationScore,
            epoch
        };
    }

    async shouldEarlyStop(trainingManager) {
        if (trainingManager.checkpoints.length < trainingManager.patience) {
            return false;
        }

        const recent = trainingManager.checkpoints.slice(-trainingManager.patience);
        const bestRecent = Math.max(...recent.map(cp => cp.getScore()));
        const currentBest = trainingManager.bestCheckpoint.getScore();

        return currentBest >= bestRecent;
    }
}



