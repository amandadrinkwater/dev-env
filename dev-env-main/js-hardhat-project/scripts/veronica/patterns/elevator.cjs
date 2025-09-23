
class Elevator {
    constructor(floors) {
        this.floors = floors;
        this.currentFloor = 0;
    }

   goToFloor(floor) {
       if (floor >= 0 && floor < this.floors) {
           this.currentFloor = floor;
           console.log(`Elevator is now on floor ${this.currentFloor}`);
       }
   }
   goUp() {
       if (this.currentFloor < this.floors - 1) {
           this.currentFloor++;
           console.log(`Elevator is now on floor ${this.currentFloor}`);
       }
   }

  goDown()  {
      if (this.currentFloor > 0)  {
          this.currentFloor--;     
        
        console.log(`Elevator is now on floor ${this.currentFloor}`);
      }
  }

  getCurrentFloor() {
      console.log(`Elevator is now on floor ${this.currentFloor}`);
    
      return this.currentFloor;
  }  

  getFloors() {
    console.log(`Elevator has ${this.floors} floors`)
    return this.floors;
  }

}

module.exports = {  Elevator }
   
async function main() {
    const elevator = new Elevator(10);
    elevator.goToFloor(5);
    elevator.goUp();
    elevator.goDown();
    elevator.getCurrentFloor();
    elevator.getFloors();
}

main()