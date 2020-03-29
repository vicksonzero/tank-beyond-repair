import MatterContainer from './MatterContainer';

import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';
import { Tank } from './Tank';
import { b2Body, b2CircleShape, b2FixtureDef, b2BodyDef, b2BodyType } from '@flyover/box2d';
import { PIXEL_TO_METER, METER_TO_PIXEL } from '../constants';
import { MainScene } from '../scenes/MainScene';

import * as Debug from 'debug';

const log = Debug('tank-beyond-repair:Bullet:log');
// const warn = Debug('tank-beyond-repair:MainScene:warn');
// warn.log = console.warn.bind(console);

export class Bullet extends Phaser.GameObjects.Container {

    team: Team;
    damage: number;
    range: number;
    sprite: Phaser.GameObjects.Graphics;
    originalX: number;
    originalY: number;

    b2Body: b2Body;

    constructor(scene: Phaser.Scene, team: Team) {
        super(scene, 0, 0, []);
        this.team = team;
        const color = this.team === Team.BLUE ? 0x3333EE : 0xEE3333;
        const graphics = this.scene.add.graphics({ fillStyle: { color } });
        this.add(graphics);
        this.sprite = graphics;
        this
            .setName('bullet');
    }
    init(x: number, y: number, damage: number, range: number): this {
        this.originalX = x;
        this.originalY = y;
        this
            .setX(x)
            .setY(y)
            ;
        this.b2Body.SetPositionXY(
            x * PIXEL_TO_METER,
            y * PIXEL_TO_METER
        );
        this.damage = damage;
        this.range = range + 20; // add 20 for buffer
        this.sprite.fillCircleShape(new Phaser.Geom.Circle(0, 0, this.damage + 2));
        return this;
    }

    initPhysics(): this {
        const hostCollision = this.team === Team.BLUE ? collisionCategory.BLUE_BULLET : collisionCategory.RED_BULLET;
        const enemyCollision = this.team === Team.BLUE ? collisionCategory.RED : collisionCategory.BLUE;



        // see node_modules/@flyover/box2d/Box2D/Collision/Shapes for more shapes
        const circleShape = new b2CircleShape();
        circleShape.m_p.Set(0, 0); // position, relative to body position
        circleShape.m_radius = 5 * PIXEL_TO_METER; // radius, in meters

        const fixtureDef = new b2FixtureDef();
        fixtureDef.shape = circleShape;
        fixtureDef.density = 0;
        fixtureDef.isSensor = true;
        fixtureDef.filter.categoryBits = hostCollision;
        fixtureDef.filter.maskBits = collisionCategory.WORLD | enemyCollision;
        fixtureDef.userData = {
            fixtureLabel: 'body',
            player: this,
        };

        const bodyDef: b2BodyDef = new b2BodyDef();
        bodyDef.type = b2BodyType.b2_dynamicBody; // can move around
        bodyDef.position.Set(
            this.x * PIXEL_TO_METER,
            this.y * PIXEL_TO_METER,
        ); // in meters
        bodyDef.angle = 0; // in radians
        bodyDef.linearDamping = 0; // t = ln(v' / v) / (-d) , where t=time_for_velocity_to_change (s), v and v' are velocity (m/s), d=damping
        bodyDef.fixedRotation = true;
        bodyDef.allowSleep = false;

        this.b2Body = (this.scene as MainScene).getPhysicsSystem().world.CreateBody(bodyDef);
        this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures

        this.on('destroy', ()=>{
            (this.scene as MainScene).getPhysicsSystem().scheduleDestroyBody(this.b2Body);
        })
        return this;
    }

    writePhysics(): this {
        this.b2Body.SetPosition({
            x: this.x * PIXEL_TO_METER,
            y: this.y * PIXEL_TO_METER,
        });
        return this;
    }

    readPhysics(): this {
        const pos = this.b2Body.GetPosition();
        this.x = pos.x * METER_TO_PIXEL;
        this.y = pos.y * METER_TO_PIXEL;
        // this.debugText.setText(`${this.x.toFixed(2)}, ${this.y.toFixed(2)}`);
        return this;
    }

    isOutOfRange() {
        return this.range < Phaser.Math.Distance.Between(
            this.x, this.y, this.originalX, this.originalY
        );
    }
}
