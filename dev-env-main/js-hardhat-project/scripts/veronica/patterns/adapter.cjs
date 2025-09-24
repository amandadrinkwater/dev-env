/**
 * Adapter Pattern Example in JavaScript (CommonJS)
 * 
 * Scenario:
 * - We have an OldPrinter class with a printOld method.
 * - We want to use it with a new system expecting a print() method.
 * - Adapter bridges the interface difference.
 */

// Old interface (incompatible)
class OldPrinter {
    printOld(text) {
        console.log(`Old Printer: ${text}`);
    }
}

// Target interface (what client expects)
class NewPrinter {
    print(text) {
        throw new Error('Not implemented');
    }
}

// Adapter class
class PrinterAdapter extends NewPrinter {
    constructor(oldPrinter) {
        super();
        this.oldPrinter = oldPrinter;
    }

    print(text) {
        // Adapts the call to the old interface
        this.oldPrinter.printOld(text);
    }
}

// Usage Example
const oldPrinter = new OldPrinter();
const printer = new PrinterAdapter(oldPrinter);

// Client code uses the new interface
printer.print('Hello, Adapter Pattern!');

// Output:
function main() {
    // NewPrinter defines the expected interface for printers.
    // Client code can work with any class that extends NewPrinter.
    const oldPrinter = new OldPrinter();
    const printer = new PrinterAdapter(oldPrinter);
    printer.print('Hello, Adapter Pattern!');
}

main();

// Output:
// Old Printer: Hello, Adapter Pattern!