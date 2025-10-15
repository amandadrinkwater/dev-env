const java = require('java');
const path = require('path');

const classDir = path.resolve(__dirname, 'javatests');

class yus_wrapper {
    constructor () {
        java.classpath.push(classDir);
        const MyTool = java.import('MyTool');

        this.toolClass = MyTool
        this.toolInstance = new MyTool()
    }

    add () {
        const result = this.toolInstance.addSync(8, 4);
        console.log("✅ Java returned:", result);
    }

    helloWorld() {
        this.toolClass.helloWorld()
    }
}

async function main() {

    const yus = new yus_wrapper()
    yus.helloWorld()
    yus.add()
   
    process.exit(0); // fully exit if still hanging
} 

main()
