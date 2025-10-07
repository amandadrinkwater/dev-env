/*

This pattern is extremely useful in scenarios where you need to manage large numbers of similar objects efficiently!

Flyweight Pattern Overview
The Flyweight pattern minimizes memory usage by sharing as much data as possible with similar objects. It's perfect when you need to create many similar objects.

When to Use Flyweight Pattern
Large number of similar objects - When your application creates many objects that share common data

Memory constraints - When memory usage is a concern and you want to optimize

Object identity not important - When objects can be shared because their intrinsic state is identical

Performance optimization - In graphics-intensive applications like games

Benefits
Reduced memory usage - Shares common data across multiple objects

Improved performance - Fewer object creations and less garbage collection

Better organization - Separates intrinsic and extrinsic state clearly

Output Example:
text
Creating new character: A with style Arial-12-#000000
Creating new character: B with style Arial-12-#000000
Creating new character: C with style Arial-12-#000000
Creating new character: A with style Times New Roman-14-#FF0000
Creating new character: A with style Arial-16-#0000FF

--- Rendering Document ---
Rendering 'A' at position (10, 20) with style Arial-12-#000000
Rendering 'B' at position (20, 20) with style Arial-12-#000000
Rendering 'A' at position (30, 20) with style Arial-12-#000000
Rendering 'C' at position (40, 20) with style Arial-12-#000000
Rendering 'B' at position (50, 20) with style Arial-12-#000000
Rendering 'A' at position (60, 20) with style Times New Roman-14-#FF0000
Rendering 'A' at position (70, 20) with style Arial-16-#0000FF

--- Memory Statistics ---
{
  totalCharacters: 7,
  uniqueCharacterObjects: 5,
  memorySaved: 2
}
This pattern is extremely useful in scenarios where you need to manage large numbers of similar objects efficiently!



*/

// Sample Code: Text Editor Character System

// Flyweight Factory
class CharacterFactory {
    constructor() {
        this.characters = {};
    }

    getCharacter(char, fontFamily = 'Arial', fontSize = 12, color = '#000000') {
        const key = `${char}_${fontFamily}_${fontSize}_${color}`;
        
        if (!this.characters[key]) {
            this.characters[key] = new Character(char, fontFamily, fontSize, color);
            console.log(`Creating new character: ${char} with style ${fontFamily}-${fontSize}-${color}`);
        }
        
        return this.characters[key];
    }

    getCharacterCount() {
        return Object.keys(this.characters).length;
    }
}

// Flyweight - Intrinsic state (shared)
class Character {
    constructor(char, fontFamily, fontSize, color) {
        this.char = char;
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
        this.color = color;
        // These properties are intrinsic (shared)
    }

    render(position) {
        // In a real application, this would render the character
        console.log(`Rendering '${this.char}' at position (${position.x}, ${position.y}) with style ${this.fontFamily}-${this.fontSize}-${this.color}`);
    }
}

// Client code - Extrinsic state (unique per instance)
class TextDocument {
    constructor() {
        this.characters = [];
        this.factory = new CharacterFactory();
    }

    addCharacter(char, position, fontFamily = 'Arial', fontSize = 12, color = '#000000') {
        const character = this.factory.getCharacter(char, fontFamily, fontSize, color);
        this.characters.push({
            character: character,
            position: position // Extrinsic state
        });
    }

    render() {
        this.characters.forEach(charData => {
            charData.character.render(charData.position);
        });
    }

    getMemoryStats() {
        return {
            totalCharacters: this.characters.length,
            uniqueCharacterObjects: this.factory.getCharacterCount(),
            memorySaved: this.characters.length - this.factory.getCharacterCount()
        };
    }
}

// Usage Example
const document = new TextDocument();

// Adding many characters - notice repeated 'A's and 'B's
document.addCharacter('A', { x: 10, y: 20 }, 'Arial', 12, '#000000');
document.addCharacter('B', { x: 20, y: 20 }, 'Arial', 12, '#000000');
document.addCharacter('A', { x: 30, y: 20 }, 'Arial', 12, '#000000'); // Reuses existing 'A'
document.addCharacter('C', { x: 40, y: 20 }, 'Arial', 12, '#000000');
document.addCharacter('B', { x: 50, y: 20 }, 'Arial', 12, '#000000'); // Reuses existing 'B'
document.addCharacter('A', { x: 60, y: 20 }, 'Times New Roman', 14, '#FF0000'); // Different style - creates new

// Different styles create new objects
document.addCharacter('A', { x: 70, y: 20 }, 'Arial', 16, '#0000FF');

console.log('\n--- Rendering Document ---');
document.render();

console.log('\n--- Memory Statistics ---');
console.log(document.getMemoryStats());

// Real-World Use Cases
// 1. Game Development - Tree Rendering

// Game with thousands of trees
class TreeType {
    constructor(name, color, texture) {
        this.name = name;
        this.color = color;
        this.texture = texture;
    }

    draw(canvas, x, y) {
        console.log(`Drawing ${this.name} tree at (${x}, ${y})`);
    }
}

class TreeFactory {
    constructor() {
        this.treeTypes = {};
    }

    getTreeType(name, color, texture) {
        const key = `${name}_${color}_${texture}`;
        if (!this.treeTypes[key]) {
            this.treeTypes[key] = new TreeType(name, color, texture);
        }
        return this.treeTypes[key];
    }
}

class Tree {
    constructor(x, y, treeType) {
        this.x = x;
        this.y = y;
        this.treeType = treeType;
    }

    draw(canvas) {
        this.treeType.draw(canvas, this.x, this.y);
    }
}

class Forest {
    constructor() {
        this.trees = [];
        this.factory = new TreeFactory();
    }

    plantTree(x, y, name, color, texture) {
        const treeType = this.factory.getTreeType(name, color, texture);
        const tree = new Tree(x, y, treeType);
        this.trees.push(tree);
    }

    draw() {
        this.trees.forEach(tree => tree.draw());
    }
}

// Usage
const forest = new Forest();
// Planting 1000 oak trees - only one TreeType object is created
for (let i = 0; i < 1000; i++) {
    forest.plantTree(i * 10, i * 5, 'Oak', 'Green', 'oak_texture.png');
}

// 2. UI Component System

// Button factory for consistent UI components
class ButtonStyle {
    constructor(backgroundColor, textColor, borderRadius, fontSize) {
        this.backgroundColor = backgroundColor;
        this.textColor = textColor;
        this.borderRadius = borderRadius;
        this.fontSize = fontSize;
    }

    render(text, position) {
        console.log(`Rendering button "${text}" at (${position.x}, ${position.y}) with style: ${this.backgroundColor}`);
    }
}

class UIComponentFactory {
    constructor() {
        this.styles = {};
    }

    getButtonStyle(backgroundColor, textColor, borderRadius = 4, fontSize = 14) {
        const key = `btn_${backgroundColor}_${textColor}_${borderRadius}_${fontSize}`;
        if (!this.styles[key]) {
            this.styles[key] = new ButtonStyle(backgroundColor, textColor, borderRadius, fontSize);
        }
        return this.styles[key];
    }
}

class UIButton {
    constructor(text, position, style) {
        this.text = text; // Extrinsic
        this.position = position; // Extrinsic
        this.style = style; // Intrinsic (shared)
    }

    render() {
        this.style.render(this.text, this.position);
    }
}

// Usage in a web application
const factory = new UIComponentFactory();
const primaryStyle = factory.getButtonStyle('#007bff', '#ffffff', 4, 14);
const dangerStyle = factory.getButtonStyle('#dc3545', '#ffffff', 4, 14);

const buttons = [
    new UIButton('Save', { x: 10, y: 10 }, primaryStyle),
    new UIButton('Cancel', { x: 100, y: 10 }, primaryStyle),
    new UIButton('Delete', { x: 190, y: 10 }, dangerStyle),
    new UIButton('Submit', { x: 280, y: 10 }, primaryStyle), // Reuses primaryStyle
];

buttons.forEach(button => button.render());

// 