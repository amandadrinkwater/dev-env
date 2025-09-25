/**
 * Elevator System Features:
 *
 * - Input validation and error handling
 * - Request queue for floor requests
 * - Direction tracking (up, down, idle)
 * - Door state and open/close logic
 * - Event callbacks for elevator events
 * - Async movement simulation
 * - History of visited floors
 * - Support for multiple elevators via ElevatorSystem
 * - Example usage demonstrating all features
 */

class Elevator {
    constructor(floors, id = 1) {
        this.floors = floors;
        this.currentFloor = 0;
        this.direction = 'idle'; // 'up', 'down', 'idle'
        this.doorOpen = false;
        this.requestQueue = [];
        this.history = [0];
        this.id = id;
        this.eventCallbacks = {
            arrive: [],
            doorOpen: [],
            doorClose: [],
            move: [],
        };
        this.moving = false;

        this.timer = null; // control the door timing, anything that control time
        this.passengers = [] // list of passengers in the elevator, each one with a target
        this.maxPassengers = 5;
        this.floorDetector = null

    }

    on(event, callback) {
        if (this.eventCallbacks[event]) {
            this.eventCallbacks[event].push(callback);
        }
    }

    emit(event, ...args) {
        if (this.eventCallbacks[event]) {
            for (const cb of this.eventCallbacks[event]) {
                cb(...args);
            }
        }
    }

    async goToFloor(floor) {
        if (typeof floor !== 'number' || floor < 0 || floor >= this.floors) {
            console.error(`Invalid floor: ${floor}`);
            return;
        }
        if (floor === this.currentFloor) {
            console.log(`Elevator ${this.id} is already on floor ${floor}`);
            return;
        }
        this.requestQueue.push(floor);
        if (!this.moving) {
            await this.processQueue();
        }
    }

    async processQueue() {
        this.moving = true;
        while (this.requestQueue.length > 0) {
            const nextFloor = this.requestQueue.shift();
            await this.moveToFloor(nextFloor);
        }
        this.direction = 'idle';
        this.moving = false;
    }

    async moveToFloor(target) {
        while (this.currentFloor !== target) {
            if (this.currentFloor < target) {
                this.direction = 'up';
                await this.goUp();
            } else {
                this.direction = 'down';
                await this.goDown();
            }
        }
        this.direction = 'idle';
        this.emit('arrive', this.currentFloor);
        await this.openDoor();
        await this.closeDoor();
    }

    async goUp() {
        if (this.currentFloor < this.floors - 1) {
            await this.simulateMove();
            this.currentFloor++;
            this.history.push(this.currentFloor);
            this.emit('move', this.currentFloor);
            console.log(`Elevator ${this.id} is now on floor ${this.currentFloor}`);
        } else {
            console.error(`Elevator ${this.id} is already at the top floor.`);
        }
    }

    async goDown() {
        if (this.currentFloor > 0) {
            await this.simulateMove();
            this.currentFloor--;
            this.history.push(this.currentFloor);
            this.emit('move', this.currentFloor);
            console.log(`Elevator ${this.id} is now on floor ${this.currentFloor}`);
        } else {
            console.error(`Elevator ${this.id} is already at the ground floor.`);
        }
    }

    async openDoor() {
        this.doorOpen = true;
        this.emit('doorOpen', this.currentFloor);
        console.log(`Elevator ${this.id} doors opened at floor ${this.currentFloor}`);
        await this.simulateDelay(500);
    }

    async closeDoor() {
        this.doorOpen = false;
        this.emit('doorClose', this.currentFloor);
        console.log(`Elevator ${this.id} doors closed at floor ${this.currentFloor}`);
        await this.simulateDelay(500);
    }

    getCurrentFloor() {
        console.log(`Elevator ${this.id} is now on floor ${this.currentFloor}`);
        return this.currentFloor;
    }

    getFloors() {
        console.log(`Elevator ${this.id} has ${this.floors} floors`);
        return this.floors;
    }

    getDirection() {
        return this.direction;
    }

    getHistory() {
        return this.history.slice();
    }

    isDoorOpen() {
        return this.doorOpen;
    }

    async simulateMove() {
        await this.simulateDelay(700);
    }

    async simulateDelay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    async addPassenger(passanger) {
        if (this.passengers.length >= this.maxPassengers) {
            console.log(`Elevator ${this.id} is full! Cannot add more passengers.`);
            return false;
        }   
        this.passengers.push(passanger);
        console.log(`Passenger added to Elevator ${this.id}. Current passengers: ${this.passengers.length}`);
        return true;
    }

    async removePassenger(passanger) {
        const index = this.passengers.indexOf(passanger);
        if (index !== -1) {
            this.passengers.splice(index, 1);
            console.log(`Passenger removed from Elevator ${this.id}. Current passengers: ${this.passengers.length}`);
            return true;
        } else {
            console.log(`Passenger not found in Elevator ${this.id}.`);
            return false;
        }   
    }

    setFloorDetector(detector) {
        this.floorDetector = detector;
    }

    detectFloor() {
        if (this.floorDetector) {
            const detectedFloor = this.floorDetector(this.currentFloor);
            console.log(`Elevator ${this.id} detected floor: ${detectedFloor}`);
            return detectedFloor;
        } else {
            console.log(`No floor detector set for Elevator ${this.id}.`);
            return null;
        }
    }       
    clearRequests() {
        this.requestQueue = [];
        console.log(`Elevator ${this.id} request queue cleared.`);      

        if (this.moving) {
            this.moving = false;
            this.direction = 'idle';
            console.log(`Elevator ${this.id} movement stopped.`);
        }   

        return true;    
        
    }

    async stop() {
        if (this.moving) {
            this.moving = false;
            this.direction = 'idle';
            console.log(`Elevator ${this.id} has been stopped at floor ${this.currentFloor}.`);
        } else {
            console.log(`Elevator ${this.id} is already idle.`);
        }
        return true;
    }

    emergencyStop() {
        this.clearRequests();
        if (this.doorOpen) {
            console.log(`Elevator ${this.id} is already stopped with doors open.`);
        } else {
            this.openDoor();
            console.log(`Elevator ${this.id} emergency stop activated. Doors opened.`);
        }
        return true;
    }
    
    reset() {   
        this.currentFloor = 0;
        this.direction = 'idle';
        this.doorOpen = false;
        this.requestQueue = [];
        this.history = [0];
        this.moving = false;
        this.passengers = [];
        console.log(`Elevator ${this.id} has been reset to initial state.`);
        return true;
    }

    async requestElevatorToFloor(floor) {
     // to check if the floor is valid, get use case
        await this.goToFloor(floor);
        return true;    
    }

    async requestElevatorToCurentFloor() {
        await this.goToFloor(this.currentFloor);
        return true;
    }

    async openDoorForDuration(duration) {
        await this.openDoor();
        await this.simulateDelay(duration);
        await this.closeDoor();
        return true;
    }

    async openDoorIndefinitely() {
        if (!this.doorOpen) {
            await this.openDoor();
            console.log(`Elevator ${this.id} doors opened indefinitely.`);
        } else {
            console.log(`Elevator ${this.id} doors are already open.`);
        }
        return true;
    }

    async closeDoorImmediately() {
        if (this.doorOpen) {
            await this.closeDoor();
            console.log(`Elevator ${this.id} doors closed immediately.`);
        }
        return true;
    }   

    async openDoorIfIdle() {
        if (this.direction === 'idle' && !this.doorOpen) {
            await this.openDoor();
            console.log(`Elevator ${this.id} doors opened because it is idle.`);
        }
        return true;
    }

    async moveToMiddleFloor() {
        const middle = Math.floor(this.floors / 2);
        await this.goToFloor(middle);
        return true;
    }

    async moveToTopFloor() {
        await this.goToFloor(this.floors - 1);
        return true;
    }
    
    async moveToGroundFloor() {
        await this.goToFloor(0);
        return true;
    }

    getPassengerCount() {
        return this.passengers.length;
    }
    
    isFull() {
        return this.passengers.length >= this.maxPassengers;
    }
    isEmpty() {
        return this.passengers.length === 0;
    }
    
    getMaxPassengers() {
        return this.maxPassengers;
    }
    setMaxPassengers(max) {
        if (typeof max === 'number' && max > 0) {
            this.maxPassengers = max;
            console.log(`Elevator ${this.id} max passengers set to ${max}`);
            return true;
        } else {
            console.error(`Invalid max passengers: ${max}`);
            return false;
        }
    }   

    getRequestQueue() {
        return this.requestQueue.slice();
    }

    clearHistory() {
        this.history = [this.currentFloor];
        console.log(`Elevator ${this.id} history cleared.`);
        return true;
    }

    async addTimer(timer) {
        this.timer = timer;
        console.log(`Elevator ${this.id} timer set.`);
        return true;
    }

    removeTimer() {
        this.timer = null;
        console.log(`Elevator ${this.id} timer removed.`);
        return true;
    }

}

// Manager for multiple elevators
class ElevatorSystem {
    constructor(numElevators, floors) {
        this.elevators = [];
        for (let i = 0; i < numElevators; i++) {
            this.elevators.push(new Elevator(floors, i + 1));
        }
    }
    getElevator(id) {
        return this.elevators[id - 1];
    }
    requestElevator(floor) {
        // Simple: pick the first idle elevator or the one closest to the floor
        let best = this.elevators[0];
        let minDist = Math.abs(best.currentFloor - floor);
        for (const e of this.elevators) {
            const dist = Math.abs(e.currentFloor - floor);
            if (e.direction === 'idle' && dist < minDist) {
                best = e;
                minDist = dist;
            }
        }
        best.goToFloor(floor);
        return best;
    }
    getStatus() {
        return this.elevators.map(e => ({
            id: e.id,
            floor: e.currentFloor,
            direction: e.direction,
            doorOpen: e.doorOpen
        }));
    }
}

module.exports = { Elevator, ElevatorSystem }

// Example usage
async function main() {
    const system = new ElevatorSystem(2, 10);
    const elevator1 = system.getElevator(1);
    const elevator2 = system.getElevator(2);

    elevator1.on('arrive', floor => console.log(`[Elevator 1] Arrived at floor ${floor}`));
    elevator2.on('arrive', floor => console.log(`[Elevator 2] Arrived at floor ${floor}`));

    // Request elevators
    system.requestElevator(5);
    system.requestElevator(7);

    // Add more requests
    setTimeout(() => elevator1.goToFloor(2), 2000);
    setTimeout(() => elevator2.goToFloor(9), 3000);

    // Print status after some time
    setTimeout(() => {
        console.log('Elevator System Status:', system.getStatus());
        console.log('Elevator 1 History:', elevator1.getHistory());
        console.log('Elevator 2 History:', elevator2.getHistory());
    }, 8000);
}

main();