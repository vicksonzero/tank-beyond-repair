import MatterContainer from './MatterContainer';
import * as Debug from 'debug';
import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';

const log = Debug('tank-beyond-repair:Item:log');
// const warn = Debug('tank-beyond-repair:Item:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;

export class Item extends MatterContainer {

    itemSprite: Image;

    // onHitPart?: (parent: any, part: Part, contactPoints: { vertex: { x: number, y: number } }[]) => void;

    private undoTintEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, []);
        this
            .setName('item')
            ;

        this.add([
            this.itemSprite = this.scene.make.image({
                x: 0, y: 0,
                key: `allSprites_default`,
                frame: 'crateMetal',
            }, false),
        ]);
    }
    init(x: number, y: number): this {
        this
            .setX(x)
            .setY(y)
            ;
        return this;
    }

    initPhysics(): this {
        this.scene.matter.add.gameObject(this, (<any>this.scene.matter.bodies).rectangle(0, 0, 32, 32, { isSensor: true, label: 'left' }));
        this
            .setMass(1)
            .setFrictionAir(0.7)
            .setFixedRotation()
            .setCollisionCategory(collisionCategory.WORLD)
            .setCollidesWith(collisionCategory.WORLD | collisionCategory.BLUE | collisionCategory.RED)
            ;
        return this;
    }

    moveInDirection(dirX: number, dirY: number) {
        this.setVelocity(dirX, dirY);
        this.setRotation(Math.atan2((<any>this.body).velocity.y, (<any>this.body).velocity.x));
    }

    // takeDamage(amount: number): this {

    //     this.hp -= amount;

    //     this.undoTintEvent = this.scene.time.addEvent({
    //         delay: 200, loop: false, callback: () => {
    //             // some_sprite.setTint(0xAAAAAA);
    //         }
    //     });

    //     if (this.hp <= 0) {
    //         if (this.undoTintEvent) this.undoTintEvent.destroy();
    //         // this.gm.makeExplosion3(this.x, this.y);
    //         // this.gm.gameIsOver = true;
    //         this.visible = false;
    //         this
    //             .setCollisionCategory(0)
    //             ;
    //         // .setPosition(-1000, -1000);
    //         this.scene.cameras.main.shake(1000, 0.04, false);
    //     }
    //     return this;
    // }
}
