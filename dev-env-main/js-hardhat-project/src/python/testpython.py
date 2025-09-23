import subprocess
import os
# print("Hello World, I am Carlos, I am here, I am Python")

def run_java(asset):

    classpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../java"))
   
    result = subprocess.run(
        ["java", "-cp", classpath, "helloworlds.HelloWorld", "Kadu Coin II"],
        capture_output=True, text=True
    )

    print("Exit code:", result.returncode) 
    print("STDOUT:", result.stdout.strip())

run_java("ETH")

