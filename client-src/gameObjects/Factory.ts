
import { b2Body, b2BodyDef, b2BodyType, b2FixtureDef, b2PolygonShape, b2World } from '@flyover/box2d';
import { Tweens } from 'phaser';
import { PIXEL_TO_METER } from '../constants';
import { collisionCategory } from '../models/collisionCategory';
import { UpgradeObject } from '../models/Upgrade';
import { IFixtureUserData } from '../PhysicsSystem';
import { MainScene } from '../scenes/MainScene';
import { HpBar } from '../ui/HpBar';
import { getUniqueID } from '../utils/UniqueID';
import { Item } from './Item';


type Image = Phaser.GameObjects.Image;
type Graphics = Phaser.GameObjects.Graphics;
type Text = Phaser.GameObjects.Text;
type Container = Phaser.GameObjects.Container;

export class Factory extends Phaser.GameObjects.Container {

    scene: MainScene;
    bodyRadius = 40;
    doorSpriteSize = 150;
    uniqueID: number;

    hp = 100;
    maxHP = 100;
    hpBar: HpBar;
    battery = 100;
    lastBatteryTick = 0;

    upgrades: UpgradeObject;

    bodySprite: Image;
    uiContainer: Container;
    upgradeAnimationsContainer: Container;
    factoryDoorL: Image;
    factoryDoorR: Image;
    factoryDoorGraphicsL: Graphics;
    factoryDoorGraphicsR: Graphics;
    platform: Container;
    platformPlate: Graphics;

    b2Body: b2Body;

    // onHitPart?: (parent: any, part: Part, contactPoints: { vertex: { x: number, y: number } }[]) => void;

    private undoTintEvent?: Phaser.Time.TimerEvent;

    constructor(scene: MainScene) {
        super(scene, 0, 0, []);
        this.uniqueID = getUniqueID();
        this
            .setName('factory')
            ;
        this.upgrades = new UpgradeObject();
        this.upgrades.setParts({
            steel: 1,
            battery: 1,
            barrel: 1,
            armor: 1,
        });
        this.lastBatteryTick = this.scene.fixedTime.now;
        this.refreshAttributes(false);

        // const color = this.team === Team.BLUE ? 'dark' : 'sand';
        let bg: Graphics;
        this.add([
            bg = this.scene.make.graphics({
                x: 0, y: 0,
            }, false),
            this.upgradeAnimationsContainer = this.scene.make.container({ x: 0, y: 0 }),
            this.bodySprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'factory_frame',
                // frame: `tankBody_${color}`,
            }, false),
        ]);

        bg.fillStyle(0x334444);
        bg.fillRect(-this.bodyRadius, -this.bodyRadius, this.bodyRadius * 2, this.bodyRadius * 2);

        this.upgradeAnimationsContainer.add([
            this.platformPlate = this.scene.make.graphics({
                x: 0, y: 0,
            }, false),
            this.platform = this.scene.make.container({ x: 0, y: 0 }),
            this.factoryDoorGraphicsL = this.scene.make.graphics({
                x: 0, y: 0,
            }, false),
            this.factoryDoorGraphicsR = this.scene.make.graphics({
                x: 0, y: 0,
            }, false),
            this.factoryDoorL = this.scene.make.image({
                x: 0, y: 0,
                key: 'factory_door',
                // frame: `tankBody_${color}`,
            }, false),
            this.factoryDoorR = this.scene.make.image({
                x: 0, y: 0,
                key: 'factory_door',
                // frame: `tankBody_${color}`,
            }, false),
        ]);

        this.initFactoryDoors();

        this.bodySprite.setAngle(90);
        this.bodySprite.setScale(0.27);
        this.upgradeAnimationsContainer.setScale(0.27);
        this.setNormalTint();

        this.on('destroy', () => {
            if (this.uiContainer) this.uiContainer.destroy();
        });

        // FIXME: not supposed to litter into constructor
        // FIXME: not supposed to use phaser tween
        // FIXME: use deterministic timers
        let upgrade = UpgradeObject.getRandomPartFromPool(5);
        this.scene.makeUpgradeGraphics(this.platform, upgrade);
        const a = new Tweens.TweenManager(this.scene);
        this.scene.fixedTweens.add({
            targets: { x: 0 },
            x: 1,
            duration: 10000,
            yoyo: true,
            repeat: -1,
            onRepeat: (tween, targets) => {
                // console.log('onRepeat');
                upgrade = UpgradeObject.getRandomPartFromPool(5);
                this.scene.makeUpgradeGraphics(this.platform, upgrade);
            },
            onYoyo: () => {
                // console.log('onYoyo');
                this.scene.spawnItem(this.x, this.y, upgrade, true);
                this.platform.list.forEach((iconGroup: Container) => iconGroup.setActive(false).setVisible(false));
                this.platform.removeAll(false);
            },
            onUpdate: (tween, target) => {
                const doorProgress = Math.max(0, Math.min(1, (target.x - 0.5) / 0.25));
                this.updateFactoryDoorProgress(1 - doorProgress);

                const plateProgress = Math.max(0, Math.min(1, (target.x - 0.5 - 0.175) / 0.325));
                this.platformPlate.setScale(plateProgress * 0.35 + 0.5);
                this.platformPlate.setAlpha(plateProgress * 0.35 + 0.5);
                this.platform.setScale((plateProgress * 0.35 + 0.5) * 5);
            },
            onComplete: (tween, targets) => {
                // console.log('onComplete');
            },
        });
    }
    init(x: number, y: number): this {
        this
            .setX(x)
            .setY(y)
            ;
        this.hp = 5;
        return this;
    }
    initUiContainer(uiContainer: Phaser.GameObjects.Container) {
        this.uiContainer = uiContainer;
        this.uiContainer.add([
        ]);
        this.uiContainer.setVisible(false);
        return this;
    }
    initHpBar(hpBar: HpBar) {
        this.hpBar = hpBar;
        this.updateHpBar();
        return this;
    }

    updateHpBar() {
        this.hpBar.updateHpBatteryBar(this.hp, this.maxHP, this.upgrades.partsList.battery);
    }

    initPhysics(physicsFinishedCallback: () => void): this {
        // see node_modules/@flyover/box2d/Box2D/Collision/Shapes for more shapes
        const polygonShape = new b2PolygonShape();
        polygonShape.SetAsBox(this.bodyRadius * PIXEL_TO_METER, this.bodyRadius * PIXEL_TO_METER); //a 4x2 rectangle

        const fixtureDef = new b2FixtureDef();
        fixtureDef.shape = polygonShape;
        fixtureDef.density = 1;
        fixtureDef.filter.categoryBits = 0;
        fixtureDef.filter.maskBits = collisionCategory.WORLD | collisionCategory.RED | collisionCategory.BLUE;
        fixtureDef.userData = {
            fixtureLabel: 'factory-body',
        } as IFixtureUserData;

        const bodyDef: b2BodyDef = new b2BodyDef();
        bodyDef.type = b2BodyType.b2_staticBody; // can move around
        bodyDef.position.Set(
            this.x * PIXEL_TO_METER,
            this.y * PIXEL_TO_METER,
        ); // in meters
        bodyDef.angle = 0; // in radians
        bodyDef.linearDamping = 0.3; // t = ln(v' / v) / (-d) , where t=time_for_velocity_to_change (s), v and v' are velocity (m/s), d=damping
        bodyDef.fixedRotation = true;
        bodyDef.userData = {
            label: 'factory',
            gameObject: this,
        };

        this.scene.getPhysicsSystem().scheduleCreateBody((world: b2World) => {
            this.b2Body = world.CreateBody(bodyDef);
            this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures
            this.b2Body.SetPositionXY(this.x * PIXEL_TO_METER, this.y * PIXEL_TO_METER);

            this.on('destroy', () => {
                this.scene.getPhysicsSystem().scheduleDestroyBody(this.b2Body);
                this.b2Body.m_userData.gameObject = null;
            });
            physicsFinishedCallback();
        });
        return this;
    }

    takeDamage(amount: number): this {

        this.hp -= amount;

        // this.bodySprite.setTint(Teams[this.team].hitTint);
        this.undoTintEvent = this.scene.fixedTime.addEvent({
            delay: 100, loop: false, callback: () => {
                // this.bodySprite.setTint(Teams[this.team].normalTint);
            }
        });

        return this;
    }

    initFactoryDoors() {
        this.platformPlate.fillStyle(0x999999);
        this.platformPlate.fillRect(-this.doorSpriteSize * 0.8, -this.doorSpriteSize * 0.8, this.doorSpriteSize * 0.8 * 2, this.doorSpriteSize * 0.8 * 2);
        this.platformPlate.lineStyle(2, 0x000000, 1);
        this.platformPlate.strokeRect(-this.doorSpriteSize * 0.8, -this.doorSpriteSize * 0.8, this.doorSpriteSize * 0.8 * 2, this.doorSpriteSize * 0.8 * 2);

        this.factoryDoorL.setOrigin(0.5 + 0.1, 0.5).setPosition(0, 0);
        this.factoryDoorR.setOrigin(0.5 + 0.1, 0.5).setPosition(0, 0);
        this.factoryDoorL.setRotation(1 / 2 * Math.PI);
        this.factoryDoorR.setRotation(-1 / 2 * Math.PI);

        this.factoryDoorGraphicsL.setPosition(0, -this.doorSpriteSize);
        this.factoryDoorGraphicsR.setPosition(0, this.doorSpriteSize);

        this.factoryDoorGraphicsL.fillStyle(0x999999);
        this.factoryDoorGraphicsL.fillRect(-this.doorSpriteSize, 0, this.doorSpriteSize * 2, this.doorSpriteSize - 15);

        this.factoryDoorGraphicsR.fillStyle(0x999999);
        this.factoryDoorGraphicsR.fillRect(-this.doorSpriteSize, 0, this.doorSpriteSize * 2, -(this.doorSpriteSize - 15));
    }

    updateFactoryDoorProgress(progress: number) {
        const adjustedProgress = Phaser.Math.Easing.Cubic.Out(progress);

        this.factoryDoorL.setPosition(0, -this.doorSpriteSize * (1 - adjustedProgress) * 0.8);
        this.factoryDoorR.setPosition(0, this.doorSpriteSize * (1 - adjustedProgress) * 0.8);

        this.factoryDoorGraphicsL.setScale(1, adjustedProgress);
        this.factoryDoorGraphicsR.setScale(1, adjustedProgress);
    }

    setHighlightTint() {
        // this.bodySprite.setTint(Teams[this.team].highlightTint);
    }

    setNormalTint() {
        // this.bodySprite.setTint(Teams[this.team].normalTint);
    }

    takeBatteryDamage(amount: number): this {
        this.upgrades.addParts({
            battery: -amount,
        });
        this.updateHpBar();

        return this;
    }

    takeAutoBatteryDamage(time: number): this {
        if (time - this.lastBatteryTick > 1000) {
            this.takeBatteryDamage(3);
            this.lastBatteryTick += 1000;
        }

        return this;
    }

    takeItem(item: Item) {
        this.setUpgrade(item.upgrades);

        this.addUpgradeAbsorbEffect(item.upgrades, new Phaser.Math.Vector2(item.x, item.y), false);
    }

    setUpgrade(upgrades: UpgradeObject) {
        this.upgrades.addParts(upgrades.partsList);

        this.refreshAttributes();
    }

    addUpgradeAbsorbEffect(upgrades: UpgradeObject, fromPosition: Phaser.Math.Vector2, isLocalToEntity: boolean) {
        let upgradeGraphics = this.scene.make.container({ x: 0, y: 0 });
        this.scene.makeUpgradeGraphics(upgradeGraphics, upgrades);
        this.upgradeAnimationsContainer.add(upgradeGraphics);

        // const point = new Phaser.Geom.Point();
        // const tempMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        // this.upgradeAnimationsContainer.getWorldTransformMatrix(tempMatrix);
        // // tempMatrix.transformPoint(item.x, item.y, point);
        upgradeGraphics.setX(fromPosition.x - (isLocalToEntity ? 0 : this.x));
        upgradeGraphics.setY(fromPosition.y - (isLocalToEntity ? 0 : this.y));
        upgradeGraphics.setScale(1.2);
        this.scene.fixedTweens.add({
            targets: upgradeGraphics,
            x: 0,
            y: 0,
            scale: 0,
            ease: 'Cubic.easeIn',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 800,
            onComplete: () => {
                upgradeGraphics.list.forEach((iconGroup: Container) => iconGroup.setActive(false).setVisible(false));
                upgradeGraphics.removeAll(false).destroy();
            },
        })
    }

    refreshAttributes(doRefreshGraphics = true) {
        if (doRefreshGraphics) {
            this.refreshUpgradeGraphics();
            this.updateHpBar();
        }
    }

    refreshUpgradeGraphics(): this {
        // this.bodySprite.setScale(Math.pow((this.upgrades.levels.chassis + 1), 1 / 3));

        return this;
    }

    repair() {
        if (this.maxHP > this.hp) {
            // this.repairCnt += 1;
            // if (this.repairCnt >= 100) {
            //     this.hp = Math.min(this.hp + 10, this.maxHP);
            //     this.repairCnt = 0;
            // }
        }
        this.updateHpBar();
        this.refreshUpgradeGraphics();
    }
    destroy(fromScene = false) {
        if (this.undoTintEvent) this.undoTintEvent.destroy();
        // this.gm.makeExplosion3(this.x, this.y);
        // this.gm.gameIsOver = true;
        this.visible = false;
        // this.b2Body.GetFixtureList().m_filter.categoryBits = 0;

        // .setPosition(-1000, -1000);
        this.scene.cameras.main.shake(100, 0.005, false);
        super.destroy(fromScene);
    }
}
