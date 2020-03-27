
import { b2World, XY } from "@flyover/box2d";
import * as Debug from 'debug';
import { PHYSICS_FRAME_SIZE } from "./constants";


const log = Debug('tank-beyond-repair:PhysicsSystem:log ');
// const warn = Debug('tank-beyond-repair:PhysicsSystem:warn');
// warn.log = console.warn.bind(console);

export class PhysicsSystem {

    world: b2World = null;
    gravity: XY = { x: 0, y: 0 };
    frameSize = PHYSICS_FRAME_SIZE; // ms

    lastUpdate = -1;

    constructor() {

    }

    init() {
        this.world = new b2World(this.gravity);
    }

    update(gameTime: number) {
        const velocityIterations = 10;   //how strongly to correct velocity
        const positionIterations = 10;   //how strongly to correct position
        const lastGameTime = this.lastUpdate;
        log(`update (from ${lastGameTime} to ${gameTime})`);

        if (this.lastUpdate === -1) {
            this.lastUpdate = gameTime;

            const timeStep = 1000 / this.frameSize; // seconds
            this.world.Step(timeStep, velocityIterations, positionIterations);
        } else {
            let i = 0;
            while (this.lastUpdate + this.frameSize < gameTime) {
                i++;

                const timeStep = 1000 / this.frameSize; // seconds
                this.world.Step(timeStep, velocityIterations, positionIterations);
                this.lastUpdate += this.frameSize;
            }

            log(`physics update: ${i} ticks (from ${lastGameTime} to ${gameTime}; ${this.lastUpdate} left)`);
        }
    }
}