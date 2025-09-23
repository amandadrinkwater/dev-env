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