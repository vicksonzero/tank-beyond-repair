import MatterContainer from './MatterContainer';
import * as Debug from 'debug';
import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';
import { HpBar } from '../ui/HpBar';

const log = Debug('tank-beyond-repair:Player:log');
// const warn = Debug('tank-beyond-repair:Player:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;

export class Player extends MatterContainer {

    hp: number;
    maxHP: number;
    hpBar: HpBar;

    // input
    mouseTarget?: Phaser.Input.Pointer;
    mouseOffset?: { x: number, y: number };
    followingMouse?: boolean;

    bodySprite: Image;
    barrelSprite: Image;


    // onHitPart?: (parent: any, part: Part, contactPoints: { vertex: { x: number, y: number } }[]) => void;

    private undoTintEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, team: Team) {
        super(scene, 0, 0, []);
        this
            .setName('player')
            ;

        const color = team === Team.BLUE ? 'blue' : 'red';
        this.add([
            this.bodySprite = this.scene.make.image({
                x: 0, y: 0,
                key: `man${capitalize(color)}_hold`,
            }, false),
        ]);
    }
    init(x: number, y: number): this {
        this
            .setX(x)
            .setY(y);
        this.hp = 5;
        this.maxHP = 5;
        return this;
    }
    initHpBar(hpBar:HpBar) {
        this.add(hpBar);
        this.hpBar = hpBar;
        this.hpBar.updateHPBar(this.hp, this.maxHP);
        return this;
    }

    initPhysics(): this {
        this.scene.matter.add.gameObject(this, { shape: { type: 'circle', radius: 20 } });
        this
            .setMass(1)
            .setFrictionAir(0)
            .setFixedRotation()
            .setCollisionCategory(collisionCategory.PLAYER)
            .setCollidesWith(collisionCategory.WORLD | collisionCategory.PLAYER | collisionCategory.ENEMY | collisionCategory.ENEMY_BULLET)
            ;
        return this;
    }

    moveInDirection(dirX: number, dirY: number) {
        this.setVelocity(dirX, dirY);
        this.setRotation(Math.atan2((<any>this.body).velocity.y, (<any>this.body).velocity.x));
    }

    takeDamage(amount: number): this {

        this.hp -= amount;

        this.undoTintEvent = this.scene.time.addEvent({
            delay: 200, loop: false, callback: () => {
                // some_sprite.setTint(0xAAAAAA);
            }
        });

        if (this.hp <= 0) {
            if (this.undoTintEvent) this.undoTintEvent.destroy();
            // this.gm.makeExplosion3(this.x, this.y);
            // this.gm.gameIsOver = true;
            this.visible = false;
            this
                .setCollisionCategory(0)
                ;
            // .setPosition(-1000, -1000);
            this.scene.cameras.main.shake(1000, 0.04, false);
        }
        return this;
    }
}
