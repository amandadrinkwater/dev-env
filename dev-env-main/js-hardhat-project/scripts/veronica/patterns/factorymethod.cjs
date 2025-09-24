/**
 * Factory Method Pattern Example in JavaScript (CommonJS)
 */

// Product interface
class Button {
    render() {
        throw new Error('render() must be implemented');
    }
}

// Concrete Products
class WindowsButton extends Button {
    render() {
        console.log('Rendering a Windows style button.');
    }
}

class MacButton extends Button {
    render() {
        console.log('Rendering a Mac style button.');
    }
}

// Creator (Factory)
class Dialog {
    createButton() {
        throw new Error('createButton() must be implemented');
    }
    renderWindow() {
        const btn = this.createButton();
        btn.render();
    }
}

// Concrete Creators
class WindowsDialog extends Dialog {
    createButton() {
        return new WindowsButton();
    }
}

class MacDialog extends Dialog {
    createButton() {
        return new MacButton();
    }
}

// Usage Example
function showDialog(osType) {
    let dialog;
    if (osType === 'windows') {
        dialog = new WindowsDialog();
    } else if (osType === 'mac') {
        dialog = new MacDialog();
    } else {
        throw new Error('Unknown OS type');
    }
    dialog.renderWindow();
}

// Example usage:
showDialog('windows'); // Output: Rendering a Windows style button.
showDialog('mac');     // Output: Rendering a Mac style button.