import MatterContainer from './MatterContainer';

import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';
import { HpBar } from '../ui/HpBar';
import { UpgradeObject, UpgradeType } from './Upgrade';


type Image = Phaser.GameObjects.Image;

export class Tank extends MatterContainer {

    static TANK_DIE = 'item-die';
    team: Team;

    hp: number;

    range: number;
    damage: number;
    attackSpeed: number;
    maxHP: number;
    movementSpeed: number;

    upgrades: UpgradeObject;

    // input
    mouseTarget?: Phaser.Input.Pointer;
    mouseOffset?: { x: number, y: number };
    followingMouse?: boolean;

    lastFired: number;

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
        this.upgrades = {
            range: 0,
            damage: 0,
            attackSpeed: 0,
            maxHP: 0,
            movementSpeed: 0,
        };
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
        this.bodySprite.setRotation(this.team === Team.BLUE ? 1.57 : -1.57);
        this.barrelSprite.setRotation(this.team === Team.BLUE ? 1.57 : -1.57);

        this.on('destroy', () => {
            console.log('hi die');
            this.emit(Tank.TANK_DIE)
        });
    }
    init(x: number, y: number): this {
        this
            .setX(x)
            .setY(y)
            ;
        this.range = 250;
        this.hp = 5;
        this.maxHP = 5;
        this.damage = 1;
        this.lastFired = 0;
        this.attackSpeed = 1000;
        return this;
    }
    initHpBar(hpBar: HpBar) {
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
            .setFrictionAir(0.5)
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

        this.updateHpBar();
        return this;
    }

    setUpgrade(upgrades: UpgradeObject) {
        Object.keys(upgrades).forEach((key: UpgradeType) => {
            this[key] += upgrades[key];
            this.upgrades[key] += upgrades[key];
        })
        // always heal at least 1
        const healAmount = Math.max(upgrades.maxHP, 1);
        this.hp = Math.min(this.hp + healAmount, this.maxHP);
    }

    setFiring({ x, y }: { x: number, y: number }) {
        this.barrelSprite.setRotation(Math.atan2(y, x) + 1.57);
        this.lastFired = Date.now();
    }
    canFire() {
        const time = Date.now();
        return (this.lastFired + this.attackSpeed < time);
    }
    destroy() {
        if (this.undoTintEvent) this.undoTintEvent.destroy();
        // this.gm.makeExplosion3(this.x, this.y);
        // this.gm.gameIsOver = true;
        this.visible = false;
        this
            .setCollisionCategory(0)
            ;
        // .setPosition(-1000, -1000);
        this.scene.cameras.main.shake(100, 0.005, false);
        super.destroy();
    }
}
