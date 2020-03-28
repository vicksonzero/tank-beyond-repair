
import { b2World, XY, b2ShapeType, b2CircleShape, b2PolygonShape, b2BodyType, b2JointType, b2DistanceJoint } from "@flyover/box2d";
import * as Debug from 'debug';
import { PHYSICS_FRAME_SIZE, METER_TO_PIXEL } from "./constants";


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
        // log(`update (from ${lastGameTime} to ${gameTime})`);

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

            // log(`physics update: ${i} ticks (from ${lastGameTime} to ${gameTime}; ${this.lastUpdate} left)`);
        }
    }

    debugDraw(graphics: Phaser.GameObjects.Graphics) {
        // see node_modules/@flyover/box2d/Box2D/Dynamics/b2World.js DrawDebugData() 
        // for more example of drawing debug data onto screen
        graphics.clear();
        this.drawBodies(graphics);
        this.drawJoints(graphics);
    }

    drawBodies(graphics: Phaser.GameObjects.Graphics) {
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            const pos = body.GetPosition();
            const angle = body.GetAngle(); // radian

            for (let fixture = body.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
                const shape = fixture.GetShape();
                const type = shape.GetType();
                const isSensor = fixture.IsSensor();
                const label = fixture.GetUserData().label;

                let color = 0xff8080;

                if (!body.IsActive()) {
                    color = 0x80804c;
                }
                else if (body.GetType() === b2BodyType.b2_staticBody) {
                    color = 0x80e580;
                }
                else if (body.GetType() === b2BodyType.b2_kinematicBody) {
                    color = 0x8080e5;
                }
                else if (!body.IsAwake()) {
                    color = 0x999999;
                }
                else {
                    color = 0xf29999;
                }

                const alpha = isSensor ? 0 : 0.5;
                graphics.lineStyle(2, color, 1);
                graphics.fillStyle(color, alpha);

                switch (type) {
                    case b2ShapeType.e_circleShape:
                        {
                            const circleShape = shape as b2CircleShape;
                            const p = circleShape.m_p;
                            const r = circleShape.m_radius;

                            graphics.strokeCircle((pos.x + p.x) * METER_TO_PIXEL, (pos.y + p.y) * METER_TO_PIXEL, r * METER_TO_PIXEL);
                            graphics.fillCircle((pos.x + p.x) * METER_TO_PIXEL, (pos.y + p.y) * METER_TO_PIXEL, r * METER_TO_PIXEL);
                            graphics.lineBetween(
                                (pos.x + p.x) * METER_TO_PIXEL, (pos.y + p.y) * METER_TO_PIXEL,
                                (pos.x + p.x + Math.cos(angle) * r) * METER_TO_PIXEL, (pos.y + p.y + Math.sin(angle) * r) * METER_TO_PIXEL
                            );
                        } break;
                    case b2ShapeType.e_polygonShape:
                        {
                            const polygonShape = shape as b2PolygonShape;
                            const vertices = polygonShape.m_vertices;
                        } break;
                }
            }
        }
    }

    drawJoints(graphics: Phaser.GameObjects.Graphics) {
        for (let joint = this.world.GetJointList(); joint; joint = joint.GetNext()) {
            const color = 0x81cccc;
            graphics.lineStyle(2, color, 1);
            const type = joint.GetType();
            const label = joint.GetUserData()?.label || '';

            const bodyA = joint.GetBodyA();
            const bodyB = joint.GetBodyB();
            const xf1 = bodyA.m_xf;
            const xf2 = bodyB.m_xf;
            const x1 = xf1.p;
            const x2 = xf2.p;
            const p1 = joint.GetAnchorA({ x: 0, y: 0 });
            const p2 = joint.GetAnchorB({ x: 0, y: 0 });

            switch (type) {
                case b2JointType.e_distanceJoint:
                    {
                        graphics.lineBetween(
                            (p1.x) * METER_TO_PIXEL, (p1.y) * METER_TO_PIXEL,
                            (p2.x) * METER_TO_PIXEL, (p2.y) * METER_TO_PIXEL
                        );
                    } break;
                default:
                    {
                        graphics.lineBetween(
                            (x1.x) * METER_TO_PIXEL, (x1.y) * METER_TO_PIXEL,
                            (p1.x) * METER_TO_PIXEL, (p1.y) * METER_TO_PIXEL
                        );
                        graphics.lineBetween(
                            (p1.x) * METER_TO_PIXEL, (p1.y) * METER_TO_PIXEL,
                            (p2.x) * METER_TO_PIXEL, (p2.y) * METER_TO_PIXEL
                        );
                        graphics.lineBetween(
                            (x2.x) * METER_TO_PIXEL, (x2.y) * METER_TO_PIXEL,
                            (p2.x) * METER_TO_PIXEL, (p2.y) * METER_TO_PIXEL
                        );
                    }
            }
        }
    }
}