import MatterContainer from './MatterContainer';

import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';
import { Tank } from './Tank';

export class Bullet extends MatterContainer {

    team: Team;
    damage: number;
    sprite: any;

    constructor(scene: Phaser.Scene, team: Team) {
        const circle = new Phaser.Geom.Circle(0, 0, 1);
        super(scene, 0, 0, []);
        this.team = team
        const graphics = this.scene.add.graphics({ fillStyle: { color: 0x0000ff } });
        graphics.fillCircleShape(circle);
        this.sprite = graphics;
        this
            .setName('bullet');
    }
    init(x: number, y: number, damage: number): this {
        this
            .setX(x)
            .setY(y)
        this.damage = damage;
        return this;
    }

    initPhysics(): this {
        const hostCollision = this.team === Team.BLUE ? collisionCategory.BLUE_BULLET : collisionCategory.RED_BULLET;
        const enemyCollison = this.team === Team.BLUE ? collisionCategory.RED : collisionCategory.BLUE;
        this.scene.matter.add.gameObject(this, (<any>this.scene.matter.bodies).circle(0, 0, 1, { isSensor: true, label: 'bullet' }));
        this
            .setMass(1)
            .setFrictionAir(0)
            .setFixedRotation()
            .setCollisionCategory(hostCollision)
            .setCollidesWith(collisionCategory.WORLD | enemyCollison)
            ;
        return this;
    }
}
