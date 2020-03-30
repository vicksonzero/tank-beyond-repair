
import { b2Body, b2BodyType, b2CircleShape, b2ContactListener, b2JointType, b2PolygonShape, b2ShapeType, b2World, XY } from "@flyover/box2d";
import * as Debug from 'debug';
import { METER_TO_PIXEL, PHYSICS_ALLOW_SLEEPING, PIXEL_TO_METER } from "./constants";


const verbose = Debug('tank-beyond-repair:PhysicsSystem:verbose ');
const log = Debug('tank-beyond-repair:PhysicsSystem:log ');
// const warn = Debug('tank-beyond-repair:PhysicsSystem:warn');
// warn.log = console.warn.bind(console);

export type CreateBodyCallback = (world: b2World) => void;

export class PhysicsSystem {

    world: b2World;
    scheduledCreateBodyList: CreateBodyCallback[] = [];
    scheduledDestroyBodyList: b2Body[] = [];

    constructor(public gravity: XY = { x: 0, y: 0 }) {
        this.world = new b2World(gravity);
    }

    init(contactListener: b2ContactListener) {
        this.world.SetAllowSleeping(PHYSICS_ALLOW_SLEEPING);
        this.world.SetContactListener(contactListener);
    }

    readStateFromGame() {
        const verboseLogs: string[] = [];
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            const userData = body.GetUserData(); // TODO: make an interface for user data
            const gameObject: Phaser.GameObjects.Components.Transform = userData.gameObject || null;
            const label = userData.label || '(no label)';
            const name = (gameObject as any).name || '(no name)';

            if (!gameObject) { continue; }
            verboseLogs.push(`Body ${label} ${name}`);

            body.SetPosition({
                x: gameObject.x * PIXEL_TO_METER,
                y: gameObject.y * PIXEL_TO_METER,
            });
            body.SetAngle(gameObject.rotation);
        }
        verbose('readStateFromGame\n' + verboseLogs.join('\n'));
    }

    writeStateIntoGame() {
        const verboseLogs: string[] = [];
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            const userData = body.GetUserData();
            const gameObject: Phaser.GameObjects.Components.Transform = userData.gameObject || null;
            const label = userData?.label || '(no label)';
            const name = (gameObject as any)?.name || '(no name)';

            if (!gameObject) { continue; }
            verboseLogs.push(`${name}'s body ${label}`);

            const pos = body.GetPosition();
            const rot = body.GetAngle(); // radians
            gameObject.x = pos.x * METER_TO_PIXEL;
            gameObject.y = pos.y * METER_TO_PIXEL;
            gameObject.setRotation(rot);
        }
        verbose('writeStateIntoGame\n' + verboseLogs.join('\n'));
    }

    update(timeStep: number, graphics?: Phaser.GameObjects.Graphics) {
        this.destroyScheduledBodies('before Step');
        this.readStateFromGame();
        if (graphics) { this.debugDraw(graphics); }
        verbose('Begin updateToFrame');
        this.updateOneFrame(timeStep);
        this.destroyScheduledBodies('after Step');
        verbose('End updateToFrame');
        this.createScheduledBodies();
        this.writeStateIntoGame();
    }

    updateOneFrame(timeStep: number) {
        const velocityIterations = 10;   //how strongly to correct velocity
        const positionIterations = 10;   //how strongly to correct position
        this.world.Step(timeStep, velocityIterations, positionIterations);
    }

    scheduleCreateBody(callback: CreateBodyCallback) {
        this.scheduledCreateBodyList.push(callback);
    }

    createScheduledBodies() {
        const len = this.scheduledCreateBodyList.length;
        if (len > 0) {
            log(`createScheduledBodies: ${len} callbacks`);
        }
        this.scheduledCreateBodyList.forEach((callback) => {
            callback(this.world);
        });
        this.scheduledCreateBodyList = [];
    }

    scheduleDestroyBody(body: b2Body) {
        this.scheduledDestroyBodyList.push(body);
    }

    destroyScheduledBodies(debugString: string) {
        const len = this.scheduledCreateBodyList.length;
        if (len > 0) {
            log(`destroyScheduledBodies(${debugString}): ${len} callbacks`);
        }
        this.scheduledDestroyBodyList.forEach((body) => {
            this.world.DestroyBody(body);
        });
        this.scheduledDestroyBodyList = [];
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
                    color = 0xe6b2b2; // 0xf29999;
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
                            graphics.beginPath();
                            vertices.forEach((v, i) => {
                                if (i === 0) {
                                    graphics.moveTo(
                                        (pos.x + v.x) * METER_TO_PIXEL,
                                        (pos.y + v.y) * METER_TO_PIXEL
                                    );
                                } else {
                                    graphics.lineTo(
                                        (pos.x + v.x) * METER_TO_PIXEL,
                                        (pos.y + v.y) * METER_TO_PIXEL
                                    );
                                }
                            });
                            graphics.closePath();
                            graphics.strokePath();
                            graphics.fillPath();
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