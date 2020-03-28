import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2FixtureDef, b2DistanceJointDef, b2RevoluteJoint, b2RevoluteJointDef, b2Fixture } from '@flyover/box2d';
import * as Debug from 'debug';
import { METER_TO_PIXEL, PIXEL_TO_METER } from '../constants';
import { MainScene } from '../scenes/MainScene';
import { HpBar } from '../ui/HpBar';
import { capitalize, IMatterContactPoints, makeUpgradeString } from '../utils/utils';
import { collisionCategory } from './collisionCategory';
import { Item } from './Item';
import MatterContainer from './MatterContainer';
import { Tank } from './Tank';
import { Team } from './Team';
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

    // input
    mouseTarget?: Phaser.Input.Pointer;
    mouseOffset?: { x: number, y: number };
    followingMouse?: boolean;

    debugText: Text;
    bodySprite: Image;
    repairSprite: Image;

    pointerTarget: GameObject;

    holdingItem: HoldingItem;
    holdingItemText: Text;

    b2Body: b2Body;
    playerHandSensor: b2Fixture;

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
            this.debugText = this.scene.make.text({
                x: 0, y: 0,
                text: '',
                style: { align: 'left' }
            })
        ]);
        this.repairSprite.visible = false;

        this.on('destroy', () => {
            if (this.undoTintEvent) this.undoTintEvent.destroy();
        });
    }
    init(x: number, y: number): this {
        this.setPosition(x, y);
        this.b2Body.SetPositionXY(x * PIXEL_TO_METER, y * PIXEL_TO_METER);
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
        const bulletCollision = this.team === Team.BLUE ? collisionCategory.RED_BULLET : collisionCategory.BLUE_BULLET;

        // see node_modules/@flyover/box2d/Box2D/Collision/Shapes for more shapes
        const circleShape = new b2CircleShape();
        circleShape.m_p.Set(0, 0); // position, relative to body position
        circleShape.m_radius = 20 * PIXEL_TO_METER; // radius, in meters

        const fixtureDef = new b2FixtureDef();
        fixtureDef.shape = circleShape;
        fixtureDef.density = 1;
        fixtureDef.filter.categoryBits = hostCollision;
        fixtureDef.filter.maskBits = collisionCategory.WORLD | collisionCategory.RED | collisionCategory.BLUE | bulletCollision;
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

        this.b2Body = (this.scene as MainScene).getPhysicsSystem().world.CreateBody(bodyDef);
        this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures



        const handCircleShape = new b2CircleShape();
        handCircleShape.m_p.Set(0, 0); // position, relative to body position,  in meters
        handCircleShape.m_radius = this.armRadius * PIXEL_TO_METER; // in meters

        const handsFixtureDef = new b2FixtureDef();
        handsFixtureDef.shape = handCircleShape;
        handsFixtureDef.density = 0;
        handsFixtureDef.isSensor = true;
        handsFixtureDef.filter.categoryBits = hostCollision;
        handsFixtureDef.filter.maskBits = collisionCategory.WORLD | collisionCategory.RED | collisionCategory.BLUE | bulletCollision;
        handsFixtureDef.userData = {
            fixtureLabel: 'hand',
            player: this,
        };
        this.playerHandSensor = this.b2Body.CreateFixture(handsFixtureDef);

        // this.playerHandSensor = (this.scene as MainScene).getPhysicsSystem().world.CreateBody(handsBodyDef);
        // this.playerHandSensor.CreateFixture(handsFixtureDef); // a body can have multiple fixtures


        return this;
    }

    writePhysics() {
        this.b2Body.SetPosition({
            x: this.x * PIXEL_TO_METER,
            y: this.y * PIXEL_TO_METER,
        });
    }
    readPhysics() {
        const pos = this.b2Body.GetPosition();
        this.x = pos.x * METER_TO_PIXEL;
        this.y = pos.y * METER_TO_PIXEL;
        this.debugText.setText(`${this.x.toFixed(2)}, ${this.y.toFixed(2)}`);
    }

    updateHpBar() {
        this.hpBar.updateHPBar(this.hp, this.maxHP);
    }

    moveInDirection(dirX: number, dirY: number) {
        this.b2Body.SetLinearVelocity({
            x: dirX * PIXEL_TO_METER,
            y: dirY * PIXEL_TO_METER,
        });

        if (dirX !== 0 || dirY !== 0) {
            const velocity = this.b2Body.GetLinearVelocity();
            const rotation = Math.atan2(velocity.y, velocity.x);
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
        const xx = Math.cos(rotation) * this.armLength;
        const yy = Math.sin(rotation) * this.armLength;

        this.b2Body.SetAngle(rotation);

        // const circleShape = this.playerHandSensor.shape as b2CircleShape;

        // circleShape.Set(
        //     {
        //         x: xx * PIXEL_TO_METER,
        //         y: yy * PIXEL_TO_METER,
        //     },
        //     circleShape.m_radius
        // );

        (this.playerHandSensor.m_shape as b2CircleShape).m_p.Set(
            xx * PIXEL_TO_METER,
            yy * PIXEL_TO_METER
        );
    }

    onActionPressed(sfx_upgrade: Phaser.Sound.BaseSound, sfx_pickup: Phaser.Sound.BaseSound) {
        if (!this.pointerTarget) {
            if (this.holdingItem) {
                // drop item on floor
                const rotation = this.bodySprite.rotation;
                const xx = Math.cos(rotation) * 30;
                const yy = Math.sin(rotation) * 30;
                const item = this.spawnItem?.(this.x + xx, this.y + yy, this.holdingItem.upgrades);

                sfx_pickup.play();

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

                sfx_pickup.play();
                this.holdingItem.upgrades = { ...item.upgrades };
                const upgradeText = makeUpgradeString(this.holdingItem.upgrades);
                this.holdingItemText.setText(upgradeText);

                item.setUpgrades(myOldUpgrade).refreshDeathTimer();
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

                sfx_pickup.play();
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

                sfx_upgrade.play();
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

    faceLeft() {
        this.bodySprite.setAngle(180);
    }
}
