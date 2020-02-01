import MatterContainer from './MatterContainer';

import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';
import { HpBar } from '../ui/HpBar';


type Image = Phaser.GameObjects.Image;

export class Tank extends MatterContainer {

    team: Team;
    hp: number;
    maxHP: number;
    damage: number;

    // input
    mouseTarget?: Phaser.Input.Pointer;
    mouseOffset?: { x: number, y: number };
    followingMouse?: boolean;

    lastFired: number;
    attackSpeed: number;

    hpBar: HpBar;
    bodySprite: Image;
    barrelSprite: Image;


    // onHitPart?: (parent: any, part: Part, contactPoints: { vertex: { x: number, y: number } }[]) => void;

    private undoTintEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, team: Team) {
        super(scene, 0, 0, []);
        this
            .setName('tank')
            ;
        this.team = team
        const color = this.team === Team.BLUE ? 'dark' : 'sand';
        this.add([
            this.bodySprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'allSprites_default',
                frame: `tankBody_${color}`,
            }, false),
            this.barrelSprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'allSprites_default',
                frame: `tank${capitalize(color)}_barrel2_outline`,
            }, false),
        ])
    }
    init(x: number, y: number): this {
        this
            .setX(x)
            .setY(y)
            ;
        this.hp = 5;
        this.maxHP = 5;
        this.damage = 10;
        this.lastFired = 0;
        this.attackSpeed = 1000;
        return this;
    }
    initHpBar(hpBar:HpBar) {
        this.add(hpBar);
        this.hpBar = hpBar;
        this.updateHpBar();
        return this;
    }
    updateHpBar() {
        this.hpBar.updateHPBar(this.hp, this.maxHP);
    }

    initPhysics(): this {
        const hostCollision = this.team === Team.BLUE ? collisionCategory.BLUE : collisionCategory.RED;
        const bulletCollison = this.team === Team.BLUE ? collisionCategory.RED_BULLET : collisionCategory.BLUE_BULLET;
        this.scene.matter.add.gameObject(this, { shape: { type: 'circle', radius: 20 } });
        this
            .setMass(1)
            .setFrictionAir(0)
            .setFixedRotation()
            .setCollisionCategory(hostCollision)
            .setCollidesWith(collisionCategory.WORLD | bulletCollison | collisionCategory.RED | collisionCategory.BLUE)
            ;
        return this;
    }

    getDamage() {
        return this.damage;
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

    setFiring() {
        this.lastFired = Date.now();
    }
    canFire() {
        const time = Date.now();
        return this.hp > 0 && (this.lastFired + this.attackSpeed < time);
    }
}
