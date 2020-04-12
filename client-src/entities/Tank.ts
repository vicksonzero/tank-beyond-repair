
import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';
import { HpBar } from '../ui/HpBar';
import { UpgradeObject, AttributeType, AttributeObject } from './Upgrade';
import { PIXEL_TO_METER } from '../constants';
import { b2Body, b2BodyType, b2CircleShape, b2FixtureDef, b2BodyDef, b2World } from '@flyover/box2d';
import { MainScene } from '../scenes/MainScene';
import { getUniqueID } from '../utils/UniqueID';
import { IFixtureUserData } from '../PhysicsSystem';

import { Immutable } from '../utils/ImmutableType';

type Image = Phaser.GameObjects.Image;
type Graphics = Phaser.GameObjects.Graphics;
type Text = Phaser.GameObjects.Text;
type Container = Phaser.GameObjects.Container;

export class Tank extends Phaser.GameObjects.Container {

    static TANK_DIE = 'tank-die';
    bodyRadius = 20;
    team: Team;
    uniqueID: number;

    repairCnt = 1;
    hp = 100;
    private _attr: AttributeObject = {
        range: 250,
        damage: 10,
        attackInterval: 1000,
        maxHP: 100,
        movementSpeed: 1,
        battery: 100,
        maxBattery: 100,
        aimSpeed: 1,
        turnSpeed: 1,
        dmgMultiplier: 1,
        chassisLevel: 1,
    }
    get attr(): Immutable<AttributeObject> { return this._attr; }

    upgrades: UpgradeObject;

    // input
    mouseTarget?: Phaser.Input.Pointer;
    mouseOffset?: { x: number, y: number };
    followingMouse?: boolean;

    lastFired: number;

    hpBar: HpBar;
    bodySprite: Image;
    barrelSprite: Image;
    turretGraphics: Graphics;
    uiContainer: Container;
    detailsText: Text;
    rangeMarker: Graphics;

    b2Body: b2Body;

    // onHitPart?: (parent: any, part: Part, contactPoints: { vertex: { x: number, y: number } }[]) => void;

    private undoTintEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, team: Team) {
        super(scene, 0, 0, []);
        this.uniqueID = getUniqueID();
        this
            .setName('tank')
            ;
        this.team = team
        this.upgrades = new UpgradeObject();
        this.upgrades.setParts({
            scrap: 1,
            battery: 100,
            cannon: 1,
            armor: 0,
        });
        const color = this.team === Team.BLUE ? 'dark' : 'sand';
        this.add([
            this.bodySprite = this.scene.make.image({
                x: 0, y: 0,
                key: 'allSprites_default',
                frame: `tankBody_${color}`,
            }, false),
            this.barrelSprite = this.scene.make.image({
                x: -4, y: 0,
                key: 'allSprites_default',
                frame: `tank${capitalize(color)}_barrel2_outline`,
            }, false),
            this.turretGraphics = this.scene.make.graphics({
                x: -4, y: 0,
            }, false),
            this.uiContainer = this.scene.make.container({ x: 0, y: 0 }),
        ]);

        this.turretGraphics.lineStyle(2, (this.team === Team.BLUE ? 0x333333 : 0x888888), 1);
        this.turretGraphics.fillStyle((this.team === Team.BLUE ? 0x8888FF : 0xFF4444), 1);
        this.turretGraphics.fillCircle(0, 0, 8);
        this.turretGraphics.strokeCircle(0, 0, 8);

        this.uiContainer.add([
            this.detailsText = this.scene.make.text({ x: 0, y: -20, text: '', style: { align: 'center' } }),
            this.rangeMarker = this.scene.make.graphics({ x: 0, y: 0 }),
        ]);
        this.uiContainer.setVisible(false);
        this.detailsText.setOrigin(0.5, 1);


        this.bodySprite.setAngle(90);
        this.barrelSprite.setOrigin(0.5, 0);
        this.barrelSprite.setAngle(-90);

        this.on('destroy', () => {
            this.emit(Tank.TANK_DIE, this);
        });
    }
    init(x: number, y: number): this {
        this
            .setX(x)
            .setY(y)
            ;
        this._attr.range = 250;
        this.hp = 5;
        this._attr.maxHP = 5;
        this._attr.damage = 1;
        this.lastFired = 0;
        this._attr.attackInterval = 1000;
        this._attr.movementSpeed = 1;
        this.refreshAttributes();
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
        this.hpBar.updateHPBar(this.hp, this._attr.maxHP, (this._attr.maxHP - 5) * 0.5);
    }

    initPhysics(physicsFinishedCallback: () => void): this {
        const hostCollision = this.team === Team.BLUE ? collisionCategory.BLUE : collisionCategory.RED;
        const bulletCollision = this.team === Team.BLUE ? collisionCategory.RED_BULLET : collisionCategory.BLUE_BULLET;


        // see node_modules/@flyover/box2d/Box2D/Collision/Shapes for more shapes
        const circleShape = new b2CircleShape();
        circleShape.m_p.Set(0, 0); // position, relative to body position
        circleShape.m_radius = this.bodyRadius * PIXEL_TO_METER; // radius, in meters

        const fixtureDef = new b2FixtureDef();
        fixtureDef.shape = circleShape;
        fixtureDef.density = 1;
        fixtureDef.filter.categoryBits = hostCollision;
        fixtureDef.filter.maskBits = collisionCategory.WORLD | bulletCollision | collisionCategory.RED | collisionCategory.BLUE;
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

    getDamage() {
        return this._attr.damage;
    }

    getRange() {
        return this._attr.range;
    }

    takeDamage(amount: number): this {

        this.hp -= amount;

        this.bodySprite.setTint(0xFF0000);
        this.undoTintEvent = this.scene.time.addEvent({
            delay: 100, loop: false, callback: () => {
                this.bodySprite.setTint(0xFFFFFF);
            }
        });

        this.updateHpBar();
        this.refreshUpgradeGraphics();
        return this;
    }

    setUpgrade(upgrades: UpgradeObject) {
        this.upgrades.addParts(upgrades.partsList);

        this.refreshAttributes();
    }

    refreshAttributes(doRefreshGraphics = true) {
        Object.keys(this._attr).forEach((attributeName: AttributeType) => {
            const oldValue = this._attr[attributeName];
            this._attr[attributeName] = this.upgrades.getAttribute(attributeName as AttributeType);

            if (attributeName === 'maxHP') {
                // always heal at least 1
                const healAmount = Math.max((this._attr[attributeName] - oldValue), 1);
                this.hp = Math.min(this.hp + healAmount, this._attr.maxHP);
            }
        });

        this._attr.attackInterval = Math.max(20, this._attr.attackInterval); // cap at a point

        if (doRefreshGraphics) { this.refreshUpgradeGraphics(); }
    }

    refreshUpgradeGraphics(): this {
        const str = `HP: ${this.hp.toFixed(2)}/${this._attr.maxHP.toFixed(2)}\n` +
            `DMG: ${this._attr.damage.toFixed(2)} x ${(1000 / this._attr.attackInterval).toFixed(2)}\n` +
            `Movement: ${this._attr.movementSpeed.toFixed(2)}x\n` +
            ``;
        this.detailsText.setText(str);

        this.rangeMarker.clear();
        this.rangeMarker.lineStyle(2, 0xFFFFFF, 0.8);
        this.rangeMarker.strokeCircle(0, 0, this._attr.range);
        this.rangeMarker.lineStyle(8, 0xFFFFFF, 0.2);
        this.rangeMarker.strokeCircle(0, 0, this._attr.range - 6);

        this.barrelSprite.setScale(1 + 0.2 * this.upgrades.partsList.cannon, 1 + 0.2 * this.upgrades.partsList.cannon);

        this.bodySprite.setScale(Math.pow(this._attr.chassisLevel, 1 / 3));

        return this;
    }

    setFiring({ x, y }: { x: number, y: number }) {
        this.barrelSprite.setRotation(Math.atan2(y, x) - Math.PI / 2 - this.rotation);
        this.lastFired = Date.now();
    }
    canFire() {
        const time = Date.now();
        return (this.lastFired + this._attr.attackInterval < time);
    }
    repair() {
        if (this._attr.maxHP > this.hp) {
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
        // this.b2Body.GetFixtureList().m_filter.categoryBits = 0;

        // .setPosition(-1000, -1000);
        this.scene.cameras.main.shake(100, 0.005, false);
        super.destroy();
    }
}
