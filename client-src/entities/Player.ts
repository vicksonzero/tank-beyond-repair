import MatterContainer from './MatterContainer';
import * as Debug from 'debug';
import { collisionCategory } from './collisionCategory';
import { capitalize, IMatterContactPoints, makeUpgradeString } from '../utils/utils';
import { Team } from './Team';
import { Item } from './Item';
import { HpBar } from '../ui/HpBar';
import { Tank } from './Tank';
import { UpgradeObject } from './Upgrade';

const log = Debug('tank-beyond-repair:Player:log');
// const warn = Debug('tank-beyond-repair:Player:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;
type GameObject = Phaser.GameObjects.GameObject;
type Container = Phaser.GameObjects.Container;
type Text = Phaser.GameObjects.Text;

interface HoldingItem extends Container {
    upgrades?: UpgradeObject;
}

export class Player extends MatterContainer {

    team: Team;
    hp: number;
    maxHP: number;
    hpBar: HpBar;
    tank: Tank;

    armLength = 30;
    armRadius = 20;

    playerHandSensor: MatterJS.Body;

    // input
    mouseTarget?: Phaser.Input.Pointer;
    mouseOffset?: { x: number, y: number };
    followingMouse?: boolean;

    bodySprite: Image;
    repairSprite: Image;

    pointerTarget: GameObject;

    holdingItem: HoldingItem;
    holdingItemText: Text;

    spawnItem: (x: number, y: number, upgrades: UpgradeObject) => Item; // to be filled in by MainScene


    // onHitPart?: (parent: any, part: Part, contactPoints: { vertex: { x: number, y: number } }[]) => void;

    private undoTintEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, team: Team) {
        super(scene, 0, 0, []);
        this.team = team;
        this
            .setName('player')
            ;

        const color = team === Team.BLUE ? 'blue' : 'red';
        this.add([
            this.bodySprite = this.scene.make.image({
                x: 0, y: 0,
                key: `man${capitalize(color)}_hold`,
            }, false),
            this.repairSprite = this.scene.make.image({
                x: 0, y: - 40,
                key: `repair`,
            }, false),
        ]);
        this.repairSprite.visible = false;

        this.on('destroy', () => {
            if (this.undoTintEvent) this.undoTintEvent.destroy();
        });
    }
    init(x: number, y: number): this {
        this.setPosition(x, y);
        this.hp = 50;
        
        this.maxHP = 50;
        
        this.updateHpBar();
        return this;
    }
    initHpBar(hpBar: HpBar) {
        this.add(hpBar);
        this.hpBar = hpBar;
        this.updateHpBar();
        return this;
    }

    initPhysics(): this {
        const hostCollision = this.team === Team.BLUE ? collisionCategory.BLUE : collisionCategory.RED;
        const bulletCollison = this.team === Team.BLUE ? collisionCategory.RED_BULLET : collisionCategory.BLUE_BULLET;

        const MatterMatter = (<any>Phaser.Physics.Matter).Matter; // be careful of any!

        const circleBody = MatterMatter.Bodies.circle(0, 0, 20, { isSensor: false, label: 'body' });

        this.scene.matter.add.gameObject(this, circleBody);

        this.playerHandSensor = this.scene.matter.add.circle(this.armLength, 0, this.armRadius, { isSensor: true, label: 'hand' });

        (<any>this.playerHandSensor).player = this;
        (<any>this.playerHandSensor).collisionFilter.category = hostCollision;
        (<any>this.playerHandSensor).collisionFilter.mask = collisionCategory.WORLD | collisionCategory.RED | collisionCategory.BLUE | bulletCollison;

        MatterMatter.Body.setPosition(circleBody, {
            x: this.x,
            y: this.y,
        });

        this
            .setMass(1)
            .setFrictionAir(0)
            .setFixedRotation()
            .setCollisionCategory(hostCollision)
            .setCollidesWith(collisionCategory.WORLD | collisionCategory.RED | collisionCategory.BLUE | bulletCollison)
            ;
        return this;
    }

    updateHpBar() {
        this.hpBar.updateHPBar(this.hp, this.maxHP);
    }

    moveInDirection(dirX: number, dirY: number) {
        this.setVelocity(dirX, dirY);

        type Body = any;

        if (dirX !== 0 || dirY !== 0) {
            const rotation = Math.atan2((<any>this.body).velocity.y, (<any>this.body).velocity.x);
            const xx = Math.cos(rotation) * this.armLength;
            const yy = Math.sin(rotation) * this.armLength;

            if (this.holdingItem) {
                this.holdingItem.setX(xx).setY(yy);
            }

            this.bodySprite.setRotation(rotation);
        }
    }

    updateAim() {
        const rotation = this.bodySprite.rotation;
        const MatterMatter = (<any>Phaser.Physics.Matter).Matter; // be careful of any!
        const xx = Math.cos(rotation) * this.armLength;
        const yy = Math.sin(rotation) * this.armLength;
        MatterMatter.Body.setPosition(this.playerHandSensor, {
            x: this.x + xx,
            y: this.y + yy,
        });
    }

    onActionPressed() {
        if (!this.pointerTarget) {
            if (this.holdingItem) {
                const rotation = this.bodySprite.rotation;
                const xx = Math.cos(rotation) * 30;
                const yy = Math.sin(rotation) * 30;
                const item = this.spawnItem?.(this.x + xx, this.y + yy, this.holdingItem.upgrades);

                if (item) {
                    const myOldUpgrade = this.holdingItem.upgrades;
                    item.setUpgrades(myOldUpgrade);
                }
                this.holdingItem.destroy();
                this.holdingItem = null;
            }
        } else if (this.pointerTarget.name === 'item') {
            const item = this.pointerTarget as Item;

            if (this.holdingItem) {
                const myOldUpgrade = { ...this.holdingItem.upgrades };

                this.holdingItem.upgrades = { ...item.upgrades };
                const upgradeText = makeUpgradeString(this.holdingItem.upgrades);
                this.holdingItemText.setText(upgradeText);

                item.setUpgrades(myOldUpgrade);
            } else {
                const rotation = this.bodySprite.rotation;
                const xx = Math.cos(rotation) * 30;
                const yy = Math.sin(rotation) * 30;
                this.add(this.holdingItem = this.scene.make.container({ x: xx, y: yy }) as HoldingItem);

                this.holdingItem.add(this.scene.make.image({
                    x: 0, y: 0,
                    key: `allSprites_default`,
                    frame: 'crateMetal',
                }));

                this.holdingItem.upgrades = { ...item.upgrades };
                const upgradeText = makeUpgradeString(this.holdingItem.upgrades);

                this.holdingItem.add(this.holdingItemText = this.scene.make.text({ x: 0, y: -20, text: upgradeText, style: { align: 'center' } }));
                this.holdingItemText.setOrigin(0.5, 1);

                this.pointerTarget.destroy();
                this.pointerTarget = null;
            }
        } else if (this.pointerTarget.name === 'tank') {
            const tank = this.pointerTarget as Tank;
            if (this.holdingItem) {

                tank.setUpgrade(this.holdingItem.upgrades);

                this.holdingItem.destroy();
                this.holdingItem = null;
            }
        }
    }

    // try to highlight an item
    onTouchingItemStart(myBody: any, itemBody: any, activeContacts: IMatterContactPoints) {
        // log('onTouchingItemStart', myBody.isSensor, myBody.label, this.pointerTarget?.name);
        // a and b are bodies, but no TS definition...
        if (!itemBody.isSensor) return;
        if (myBody.label !== 'hand') return;
        // console.log('onTouchingItemStart do');

        // if not holding item, prefer item over tank
        if (!this.holdingItem && this.pointerTarget) { // if already aiming at something
            if (this.pointerTarget.name === 'item') {
                // ignore the exchange if already looking at item
                return;
            } else {
                // give up target only if is tank
                const tank = this.pointerTarget as Tank;
                tank.off(Tank.TANK_DIE, this.onTargetDie);

                tank.bodySprite.setTint(0xFFFFFF);
                tank.uiContainer.setVisible(false);
                // give up tank and continue to look for item
            }
        }
        // if i am looking for an item
        // highlight the item 
        const item = itemBody.gameObject as Item;
        this.pointerTarget = item;
        item.on(Item.ITEM_DIE, this.onTargetDie);

        item.itemSprite.setTint(0xAAAAAA);
        item.itemText.setVisible(true);
    }

    onTouchingItemEnd(myBody: any, itemBody: any, activeContacts: IMatterContactPoints) {
        if (!myBody.isSensor) return;
        if (myBody.label !== 'hand') return;

        const item = itemBody.gameObject as Item;
        if (!item) return;
        if (this.pointerTarget !== item) return;

        item.off(Item.ITEM_DIE, this.onTargetDie);
        this.pointerTarget = null;

        item.itemSprite.setTint(0xFFFFFF);
        item.itemText.setVisible(false);
    }

    onTargetDie = (target: GameObject) => {
        if (this.pointerTarget !== target) return;
        this.pointerTarget = null;
        this.tank = null;
        this.repairSprite.visible = false;
    }

    onTouchingTankStart(myBody: any, tankBody: any, activeContacts: any) {
        // a and b are bodies, but no TS definition...
        // log('onTouchingTankStart', myBody.isSensor, myBody.label, this.pointerTarget?.name);

        if (!myBody.isSensor) return;
        if (myBody.label !== 'hand') return;

        // console.log('onTouchingTankStart do');

        // if holding an item
        if (this.holdingItem) {
            // prefer tank over item
            if (this.pointerTarget?.name === 'tank') { // if already pointing at tank
                // we got what we want. exit.
                return;
            } else if (this.pointerTarget?.name === 'item') {
                // give up item
                const item = this.pointerTarget as Item;
                item.off(Item.ITEM_DIE, this.onTargetDie);

                item.itemSprite.setTint(0xFFFFFF);
                item.itemText.setVisible(false);
                // give up item and continue to look for tank
            }
        } else if (this.pointerTarget) {
            return;
        }

        const tank = tankBody.gameObject as Tank;
        this.pointerTarget = tank;
        tank.on(Tank.TANK_DIE, this.onTargetDie);

        this.tank = tank;
        this.repairSprite.visible = true;

        tank.bodySprite.setTint(0xAAAAAA);
        tank.uiContainer.setVisible(true);
    }

    onTouchingTankEnd(myBody: any, tankBody: any, activeContacts: IMatterContactPoints) {
        // log('onTouchingTankEnd', myBody.isSensor, myBody.label, this.pointerTarget?.name);
        if (!myBody.isSensor) return;
        if (myBody.label !== 'hand') return;

        const tank = tankBody.gameObject as Tank;
        if (!tank) return;
        if (this.pointerTarget !== tank) return;
        // console.log('onTouchingTankEnd do', new Error());

        // const dist = Phaser.Math.Distance.Between(myBody.position.x, myBody.position.y, tankBody.position.x, tankBody.position.y);

        // if (dist <= (this.armRadius + tank.bodyRadius)) return;

        tank.off(Tank.TANK_DIE, this.onTargetDie);
        this.pointerTarget = null;

        // for repair only
        this.tank = null;
        this.repairSprite.visible = false;

        tank.bodySprite.setTint(0xFFFFFF);
        tank.uiContainer.setVisible(false);
    }

    takeDamage(amount: number): this {
        this.hp -= amount;
        this.hp = Math.max(0, this.hp);

        this.undoTintEvent = this.scene.time.addEvent({
            delay: 200, loop: false, callback: () => {
                // some_sprite.setTint(0xAAAAAA);
            }
        });

        return this;
    }
}
