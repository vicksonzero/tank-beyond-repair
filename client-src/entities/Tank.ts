import MatterContainer from './MatterContainer';

import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';
import { HpBar } from '../ui/HpBar';
import { UpgradeObject, UpgradeType } from './Upgrade';


type Image = Phaser.GameObjects.Image;
type Graphics = Phaser.GameObjects.Graphics;
type Text = Phaser.GameObjects.Text;
type Container = Phaser.GameObjects.Container;

export class Tank extends MatterContainer {

    static TANK_DIE = 'item-die';
    bodyRadius = 20;
    team: Team;

    hp: number;

    range: number;
    damage: number;
    repairCnt: number = 0;
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
    uiContainer: Container;
    detailsText: Text;
    rangeMarker: Graphics;



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
            this.uiContainer = this.scene.make.container({ x: 0, y: 0 }),
        ]);

        this.uiContainer.add([
            this.detailsText = this.scene.make.text({ x: 0, y: -20, text: '', style: { align: 'center' } }),
            this.rangeMarker = this.scene.make.graphics({ x: 0, y: 0 }),
        ]);
        this.uiContainer.setVisible(false);
        this.detailsText.setOrigin(0.5, 1);


        this.bodySprite.setRotation(this.team === Team.BLUE ? 1.57 : -1.57);
        this.barrelSprite.setRotation(this.team === Team.BLUE ? 1.57 : -1.57);

        this.on('destroy', () => {
            this.emit(Tank.TANK_DIE);
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
        this.refreshUpgradeGraphics();
        this.updateHpBar();
        this.refreshUpgradeGraphics();
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
        this.scene.matter.add.gameObject(this, { shape: { type: 'circle', radius: this.bodyRadius }, label: 'tank-body' });
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

    getRange() {
        return this.range;
    }

    takeDamage(amount: number): this {

        this.hp -= amount;

        this.undoTintEvent = this.scene.time.addEvent({
            delay: 200, loop: false, callback: () => {
                // some_sprite.setTint(0xAAAAAA);
            }
        });

        this.updateHpBar();
        this.refreshUpgradeGraphics();
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

        this.refreshUpgradeGraphics();
    }

    refreshUpgradeGraphics(): this {
        const str = `HP: ${this.hp}/${this.maxHP}\n` +
            `DMG: ${this.damage} x ${1000 / this.attackSpeed}\n` +
            ``;
        this.detailsText.setText(str);

        this.rangeMarker.clear();
        this.rangeMarker.lineStyle(2, 0xFFFFFF, 0.8);
        this.rangeMarker.strokeCircle(0, 0, this.range);
        this.rangeMarker.lineStyle(2, 0xAAAAAA, 0.8);
        this.rangeMarker.strokeCircle(0, 0, this.range - 2);

        return this;
    }

    setFiring({ x, y }: { x: number, y: number }) {
        this.barrelSprite.setRotation(Math.atan2(y, x) + 1.57);
        this.lastFired = Date.now();
    }
    canFire() {
        const time = Date.now();
        return (this.lastFired + this.attackSpeed < time);
    }
    repair() {
        if (this.maxHP > this.hp) {
            this.repairCnt += 1;
            if (this.repairCnt >= 100) {
                this.hp += 1;
                this.repairCnt = 0;
            }
        }
        this.updateHpBar();
        this.refreshUpgradeGraphics();
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
