const { Composite, Leaf, demonstrateComposite } = require('./composite.cjs');

// Simple usage example
console.log('=== Basic Usage Example ===\n');

// Create a simple organizational structure
const company = new Composite('Tech Company');

const engineering = new Composite('Engineering Department');
const marketing = new Composite('Marketing Department');

const dev1 = new Leaf('Developer John');
const dev2 = new Leaf('Developer Sarah');
const designer = new Leaf('Designer Mike');

engineering.add(dev1);
engineering.add(dev2);
marketing.add(designer);

company.add(engineering);
company.add(marketing);

// Display the structure
console.log('Company Structure:');
company.display();

console.log(`\nTotal employees: ${company.countComponents() - 3}`); // Subtract departments