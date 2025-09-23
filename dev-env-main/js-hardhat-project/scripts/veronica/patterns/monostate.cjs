
// Monostate Pattern Example
// All instances share the same state, but each instance is a separate object

class DatabaseConnection {
    constructor() {
        // All instances share the same static properties
        // This creates the monostate behavior
    }

    // Static properties that are shared across all instances
    static _host = null;
    static _port = null;
    static _database = null;
    static _isConnected = false;
    static _connectionPool = [];
    static _queryCount = 0;

    // Instance methods that operate on shared state
    connect(host, port, database) {
        DatabaseConnection._host = host;
        DatabaseConnection._port = port;
        DatabaseConnection._database = database;
        DatabaseConnection._isConnected = true;
        
        console.log(`Connected to database: ${database} at ${host}:${port}`);
        return this;
    }

    disconnect() {
        DatabaseConnection._isConnected = false;
        DatabaseConnection._connectionPool = [];
        console.log('Disconnected from database');
        return this;
    }

    query(sql) {
        if (!DatabaseConnection._isConnected) {
            throw new Error('Not connected to database');
        }
        
        DatabaseConnection._queryCount++;
        console.log(`Executing query #${DatabaseConnection._queryCount}: ${sql}`);
        
        // Simulate query execution
        return {
            query: sql,
            queryNumber: DatabaseConnection._queryCount,
            timestamp: new Date().toISOString()
        };
    }

    getConnectionInfo() {
        return {
            host: DatabaseConnection._host,
            port: DatabaseConnection._port,
            database: DatabaseConnection._database,
            isConnected: DatabaseConnection._isConnected,
            totalQueries: DatabaseConnection._queryCount
        };
    }

    addToPool(connectionId) {
        DatabaseConnection._connectionPool.push(connectionId);
        console.log(`Added connection ${connectionId} to pool. Pool size: ${DatabaseConnection._connectionPool.length}`);
    }

    getPoolSize() {
        return DatabaseConnection._connectionPool.length;
    }

    // Reset state (useful for testing)
    static reset() {
        DatabaseConnection._host = null;
        DatabaseConnection._port = null;
        DatabaseConnection._database = null;
        DatabaseConnection._isConnected = false;
        DatabaseConnection._connectionPool = [];
        DatabaseConnection._queryCount = 0;
    }
}

// Another example: Application Settings using Monostate
class AppSettings {
    static _theme = 'light';
    static _language = 'en';
    static _notifications = true;
    static _debugMode = false;

    setTheme(theme) {
        AppSettings._theme = theme;
        console.log(`Theme set to: ${theme}`);
        return this;
    }

    getTheme() {
        return AppSettings._theme;
    }

    setLanguage(language) {
        AppSettings._language = language;
        console.log(`Language set to: ${language}`);
        return this;
    }

    getLanguage() {
        return AppSettings._language;
    }

    toggleNotifications() {
        AppSettings._notifications = !AppSettings._notifications;
        console.log(`Notifications ${AppSettings._notifications ? 'enabled' : 'disabled'}`);
        return this;
    }

    areNotificationsEnabled() {
        return AppSettings._notifications;
    }

    toggleDebugMode() {
        AppSettings._debugMode = !AppSettings._debugMode;
        console.log(`Debug mode ${AppSettings._debugMode ? 'enabled' : 'disabled'}`);
        return this;
    }

    isDebugMode() {
        return AppSettings._debugMode;
    }

    getAllSettings() {
        return {
            theme: AppSettings._theme,
            language: AppSettings._language,
            notifications: AppSettings._notifications,
            debugMode: AppSettings._debugMode
        };
    }

    static reset() {
        AppSettings._theme = 'light';
        AppSettings._language = 'en';
        AppSettings._notifications = true;
        AppSettings._debugMode = false;
    }
}

// Demo function
function demonstrateMonostate() {
    console.log('=== Monostate Pattern Demo ===\n');

    console.log('--- Database Connection Example ---');
    
    // Create multiple instances
    const db1 = new DatabaseConnection();
    const db2 = new DatabaseConnection();
    const db3 = new DatabaseConnection();

    console.log('Created 3 separate DatabaseConnection instances');
    console.log(`db1 === db2: ${db1 === db2}`); // false - different objects
    console.log(`db1 === db3: ${db1 === db3}`); // false - different objects

    // Connect using first instance
    db1.connect('localhost', 5432, 'myapp_db');
    
    // All instances now reflect the same state
    console.log('\nConnection info from db1:', db1.getConnectionInfo());
    console.log('Connection info from db2:', db2.getConnectionInfo());
    console.log('Connection info from db3:', db3.getConnectionInfo());

    // Execute queries from different instances
    db1.query('SELECT * FROM users');
    db2.query('SELECT * FROM products');
    db3.query('UPDATE users SET last_login = NOW()');

    // Add connections to pool from different instances
    db1.addToPool('conn_001');
    db2.addToPool('conn_002');
    db3.addToPool('conn_003');

    console.log(`\nPool size from db1: ${db1.getPoolSize()}`);
    console.log(`Pool size from db2: ${db2.getPoolSize()}`);
    console.log(`Pool size from db3: ${db3.getPoolSize()}`);

    console.log('\n--- App Settings Example ---');
    
    const settings1 = new AppSettings();
    const settings2 = new AppSettings();

    console.log('\nInitial settings from settings1:', settings1.getAllSettings());
    console.log('Initial settings from settings2:', settings2.getAllSettings());

    // Modify settings using first instance
    settings1.setTheme('dark').setLanguage('es').toggleNotifications();

    // Second instance reflects the same changes
    console.log('\nAfter changes - settings from settings1:', settings1.getAllSettings());
    console.log('After changes - settings from settings2:', settings2.getAllSettings());

    // Modify using second instance
    settings2.toggleDebugMode();

    // First instance sees the change
    console.log('\nAfter debug toggle - settings from settings1:', settings1.getAllSettings());
    console.log('After debug toggle - settings from settings2:', settings2.getAllSettings());

    // Clean up
    DatabaseConnection.reset();
    AppSettings.reset();
    console.log('\nState reset for both examples');
}

module.exports = { 
    DatabaseConnection, 
    AppSettings, 
    demonstrateMonostate 
};

// Run demonstration if this file is executed directly
if (require.main === module) {
    demonstrateMonostate();
}
