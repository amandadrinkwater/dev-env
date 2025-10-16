
class yus_wrapper {
    constructor () {

        // chat gpt has a generic wrapper for everything.. we should use

        const java = require('java');
        const path = require('path');

        const classDir = path.resolve(__dirname, 'javatests'); 

        java.classpath.push(classDir);
        const MyTool = java.import('MyTool');

        this._class = MyTool
        this._instance = new MyTool()
    }

    add () {
        const result = this._instance.addSync(8, 4);
        console.log("✅ Java returned:", result);
    }

    helloWorld() {
        this._class.helloWorld()
    }
}

async function main() {

    const yus = new yus_wrapper()
    yus.helloWorld()
    yus.add()
   
    process.exit(0); // fully exit if still hanging

} 

main()
