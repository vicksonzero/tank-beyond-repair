
import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2FixtureDef, b2World, b2PolygonShape } from '@flyover/box2d';
import { AttributeType, IAttributeMap } from '../config/config';
import { PIXEL_TO_METER } from '../constants';
import { IFixtureUserData } from '../PhysicsSystem';
import { MainScene } from '../scenes/MainScene';
import { HpBar } from '../ui/HpBar';
import { Immutable } from '../utils/ImmutableType';
import { getUniqueID } from '../utils/UniqueID';
import { capitalize } from '../utils/utils';
import { collisionCategory } from '../models/collisionCategory';
import { Team } from '../models/Team';
import { UpgradeObject } from '../models/Upgrade';
import { Item } from './Item';
import { Teams } from '../models/Teams';


type Image = Phaser.GameObjects.Image;
type Graphics = Phaser.GameObjects.Graphics;
type Text = Phaser.GameObjects.Text;
type Container = Phaser.GameObjects.Container;

export class Factory extends Phaser.GameObjects.Container {

    scene: MainScene;
    bodyRadius = 40;
    uniqueID: number;

    hp = 100;
    maxHP = 100;
    hpBar: HpBar;
    battery = 100;
    lastBatteryTick = 0;

    upgrades: UpgradeObject;

    // input
    mouseTarget?: Phaser.Input.Pointer;
    mouseOffset?: { x: number, y: number };
    followingMouse?: boolean;

    bodySprite: Image;
    uiContainer: Container;
    upgradeAnimationsContainer: Container;
    factoryDoorL: Image;
    factoryDoorR: Image;
    factoryDoorGraphicsL: Graphics;
    factoryDoorGraphicsR: Graphics;

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
        const color = 'sand';
        this.add([
            this.upgradeAnimationsContainer = this.scene.make.container({ x: 0, y: 0 }),
            this.bodySprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'factory_frame',
                // frame: `tankBody_${color}`,
            }, false),
        ]);

        this.upgradeAnimationsContainer.add([
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
        this.factoryDoorL.setOrigin(0.5).setPosition(0, 0);
        this.factoryDoorR.setOrigin(0.5).setPosition(0, 0);
        this.factoryDoorR.setRotation(Math.PI);

        this.bodySprite.setAngle(90);
        this.bodySprite.setScale(0.27);
        this.upgradeAnimationsContainer.setScale(0.27);
        this.setNormalTint();

        this.on('destroy', () => {
            if (this.uiContainer) this.uiContainer.destroy();
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
        fixtureDef.filter.categoryBits = collisionCategory.WORLD;
        fixtureDef.filter.maskBits = collisionCategory.WORLD | collisionCategory.RED | collisionCategory.BLUE;
        fixtureDef.userData = {
            fixtureLabel: 'tank-body',
        } as IFixtureUserData;

        const bodyDef: b2BodyDef = new b2BodyDef();
        bodyDef.type = b2BodyType.b2_dynamicBody; // can move around
        bodyDef.position.Set(
            this.x * PIXEL_TO_METER,
            this.y * PIXEL_TO_METER,
        ); // in meters
        bodyDef.angle = 0; // in radians
        bodyDef.linearDamping = 0.3; // t = ln(v' / v) / (-d) , where t=time_for_velocity_to_change (s), v and v' are velocity (m/s), d=damping
        bodyDef.fixedRotation = true;
        bodyDef.userData = {
            label: 'tank',
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

    addUpgradeAbsorbEffect(upgrades: UpgradeObject, fromPosition: Phaser.Math.Vector2, isLocalToTank: boolean) {
        let upgradeGraphics = this.scene.make.container({ x: 0, y: 0 });
        this.scene.makeUpgradeGraphics(upgradeGraphics, upgrades);
        this.upgradeAnimationsContainer.add(upgradeGraphics);

        // const point = new Phaser.Geom.Point();
        // const tempMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        // this.upgradeAnimationsContainer.getWorldTransformMatrix(tempMatrix);
        // // tempMatrix.transformPoint(item.x, item.y, point);
        upgradeGraphics.setX(fromPosition.x - (isLocalToTank ? 0 : this.x));
        upgradeGraphics.setY(fromPosition.y - (isLocalToTank ? 0 : this.y));
        upgradeGraphics.setScale(1.2);
        this.scene.add.tween({
            targets: upgradeGraphics,
            x: 0,
            y: 0,
            scale: 0,
            ease: 'Cubic.easeIn',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 800,
            onComplete: () => { upgradeGraphics.destroy(); },
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
    destroy() {
        if (this.undoTintEvent) this.undoTintEvent.destroy();
        // this.gm.makeExplosion3(this.x, this.y);
        // this.gm.gameIsOver = true;
        this.visible = false;
        // this.b2Body.GetFixtureList().m_filter.categoryBits = 0;

        // .setPosition(-1000, -1000);
        this.scene.cameras.main.shake(100, 0.005, false);
        super.destroy();
    }
}
