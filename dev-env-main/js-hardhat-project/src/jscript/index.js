import { spawn } from 'child_process';

//console.log('Hello World, I am Carlos, I am here');

function runPythonScript(arg) {
  return new Promise((resolve, reject) => {
    
    const pyProcess =  spawn("python3", ['src/python/testpython.py']);

    let output = '';
    let errorOutput = '';

    console.log(arg);

    pyProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());

        console.log('Hello World, I am Carlos, I am here on Python')
        console.log(output.toString());

      } else {
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      }
    });

/*
    const javaProcess = spawn("java", ['-cp', 'src/java', 'helloworlds.HelloWorld', 'Kadu Coin II']);

    javaProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    javaProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    javaProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());

        console.log('Hello World, I am Carlos, I am here on Java')
        console.log(output.toString());

      } else {
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      }
    }); */
  
  });
}

runPythonScript();

/*

to study better, synchronizing processes

async function runAll(args) {
  const promises = args.map(arg => runPythonScript(arg));
  const results = await Promise.all(promises);

  results.forEach((result, index) => {
    console.log(`Result for ${args[index]}:`, result);
  });
}

runAll(['arg1', 'arg2', 'arg3']);

*/
