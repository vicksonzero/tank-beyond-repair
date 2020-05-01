import { b2Body, b2BodyDef, b2BodyType, b2FixtureDef, b2PolygonShape, b2World } from '@flyover/box2d';
import * as Debug from 'debug';
import { GameObjects } from 'phaser';
import { ITEM_LIFESPAN, ITEM_LIFESPAN_WARNING, PIXEL_TO_METER } from '../constants';
import { IFixtureUserData } from '../PhysicsSystem';
import { MainScene } from '../scenes/MainScene';
import { getUniqueID } from '../utils/UniqueID';
import { collisionCategory } from './collisionCategory';
import { UpgradeObject } from './Upgrade';

const log = Debug('tank-beyond-repair:Item:log');
// const warn = Debug('tank-beyond-repair:Item:warn');
// warn.log = console.warn.bind(console);

type Image = GameObjects.Image;
type Text = GameObjects.Text;
type Container = GameObjects.Container;


export class Item extends GameObjects.Container {


    static ITEM_DIE = 'item-die';
    itemSprite: Image;
    itemContainer: Container;
    itemText: Text;
    uniqueID: number;

    upgrades: UpgradeObject;

    private warningEvent?: Phaser.Time.TimerEvent;
    private warningLoop?: Phaser.Time.TimerEvent;
    private dieEvent?: Phaser.Time.TimerEvent;
    b2Body: b2Body;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, []);
        this.uniqueID = getUniqueID();
        this
            .setName('item')
            ;
        this.upgrades = new UpgradeObject();

        this.add([
            this.itemSprite = this.scene.make.image({
                x: 0, y: 0,
                key: `allSprites_default`,
                frame: 'crateMetal',
            }, false),
            this.itemContainer = this.scene.make.container({
                x: 0, y: 0,
            }),
            this.itemText = this.scene.make.text({
                x: 0, y: -20,
                text: '',
                style: { align: 'center' },
            }),

        ]);
        this.itemText.setOrigin(0.5, 1);
        // this.itemText.setVisible(false);

        this.on('destroy', () => {
            if (this.warningEvent) this.warningEvent.destroy();
            if (this.warningLoop) this.warningLoop.destroy();
            if (this.dieEvent) this.dieEvent.destroy();

            this.emit(Item.ITEM_DIE, this);
        });
    }
    init(x: number, y: number, upgrades: UpgradeObject): this {
        this
            .setX(x)
            .setY(y)
            ;
        this.upgrades.setParts(upgrades.partsList);
        return this;
    }

    initPhysics(physicsFinishedCallback: () => void): this {
        // see node_modules/@flyover/box2d/Box2D/Collision/Shapes for more shapes
        const polygonShape = new b2PolygonShape();
        polygonShape.SetAsBox(16 * PIXEL_TO_METER, 16 * PIXEL_TO_METER); //a 4x2 rectangle

        const fixtureDef = new b2FixtureDef();
        fixtureDef.shape = polygonShape;
        fixtureDef.density = 0;
        fixtureDef.isSensor = true;
        fixtureDef.filter.categoryBits = collisionCategory.WORLD;
        fixtureDef.filter.maskBits = collisionCategory.WORLD | collisionCategory.BLUE | collisionCategory.RED;
        fixtureDef.userData = {
            fixtureLabel: 'item-body',
        } as IFixtureUserData;

        const bodyDef: b2BodyDef = new b2BodyDef();
        bodyDef.type = b2BodyType.b2_dynamicBody; // can move around
        bodyDef.position.Set(
            this.x * PIXEL_TO_METER,
            this.y * PIXEL_TO_METER,
        ); // in meters
        bodyDef.angle = 0; // in radians
        bodyDef.linearDamping = 0.002; // t = ln(v' / v) / (-d) , where t=time_for_velocity_to_change (s), v and v' are velocity (m/s), d=damping
        bodyDef.fixedRotation = true;
        bodyDef.allowSleep = false;
        bodyDef.userData = {
            label: 'item',
            gameObject: this,
        };

        (this.scene as MainScene).getPhysicsSystem().scheduleCreateBody((world: b2World) => {
            this.b2Body = world.CreateBody(bodyDef);
            this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures
            this.b2Body.SetPositionXY(this.x * PIXEL_TO_METER, this.y * PIXEL_TO_METER);

            this.on('destroy', () => {
                (this.scene as MainScene).getPhysicsSystem().scheduleDestroyBody(this.b2Body);
                this.b2Body.m_userData.gameObject = null;
            });
            physicsFinishedCallback();
        });

        return this;
    }

    initDeathTimer(): this {
        this.warningEvent = this.scene.time.addEvent({
            delay: ITEM_LIFESPAN_WARNING,
            callback: () => {
                this.warningLoop = this.scene.time.addEvent({
                    delay: 100,
                    callback: () => { this.itemSprite.setVisible(!this.itemSprite.visible) },
                    loop: true,
                });
            },
            loop: false,
        });
        this.dieEvent = this.scene.time.addEvent({ delay: ITEM_LIFESPAN, callback: () => { this.destroy() }, loop: false });
        return this;
    }


    refreshDeathTimer(): this {
        if (this.warningEvent) this.warningEvent.destroy();
        if (this.warningLoop) this.warningLoop.destroy();
        if (this.dieEvent) this.dieEvent.destroy();
        this.itemSprite.setVisible(true);
        this.initDeathTimer();
        return this;
    }

    setUpgrades(upgrades: UpgradeObject): this {
        this.upgrades.setParts(upgrades.partsList);

        // const upgradeText = UpgradeObject.makeUpgradeString(this.upgrades);
        // this.itemText.setText(upgradeText);
        (this.scene as MainScene).makeUpgradeGraphics(this.itemContainer, this.upgrades);
        return this;
    }
}
