
async function HelloWorld(name) {

    console.log("Hello World to " + name + "!");
    
}

async function main(param) {

    const args = process.argv.slice(2);

    // Join them into a single string (multi-word name)
    const name = args.length > 0 ? args.join(" ") : "Anonymous";

    await HelloWorld(name); 
}

main().then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});



