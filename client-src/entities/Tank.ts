
import { b2Body, b2BodyDef, b2BodyType, b2CircleShape, b2FixtureDef, b2World } from '@flyover/box2d';
import { AttributeType, IAttributeMap } from '../config/config';
import { PIXEL_TO_METER } from '../constants';
import { IFixtureUserData } from '../PhysicsSystem';
import { MainScene } from '../scenes/MainScene';
import { HpBar } from '../ui/HpBar';
import { Immutable } from '../utils/ImmutableType';
import { getUniqueID } from '../utils/UniqueID';
import { capitalize } from '../utils/utils';
import { collisionCategory } from './collisionCategory';
import { Team } from './Team';
import { UpgradeObject } from './Upgrade';
import { Item } from './Item';
import { Teams } from './Teams';


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
    battery = 100;
    lastBatteryTick = 0;

    private _attr: IAttributeMap = {
        range: 250,
        damage: 10,
        attackInterval: 1000,
        maxHP: 100,
        movementSpeed: 1,
        maxBattery: 100,
        aimSpeed: 1,
        turnSpeed: 1,
        dmgMultiplier: 1,
    }
    get attr(): Immutable<IAttributeMap> { return this._attr; }

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
    upgradeAnimationsContainer: Container;

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
            steel: 1,
            battery: 100,
            barrel: 1,
            armor: 0,
        });
        this.lastBatteryTick = this.scene.time.now;
        this.refreshAttributes(false);

        // const color = this.team === Team.BLUE ? 'dark' : 'sand';
        const color = 'sand';
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

        this.add(
            this.upgradeAnimationsContainer = this.scene.make.container({ x: 0, y: 0 })
        );

        this.bodySprite.setAngle(90);
        this.barrelSprite.setOrigin(0.5, 0);
        this.barrelSprite.setAngle(-90);
        this.setNormalTint();

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
        this.hpBar.updateHpBatteryBar(this.hp, this._attr.maxHP, this.upgrades.partsList.battery, (this._attr.maxHP - 5) * 0.2);
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

        this.bodySprite.setTint(Teams[this.team].hitTint);
        this.undoTintEvent = (this.scene as MainScene).fixedTime.addEvent({
            delay: 100, loop: false, callback: () => {
                this.bodySprite.setTint(Teams[this.team].normalTint);
            }
        });

        this.updateHpBar();
        this.refreshUpgradeGraphics();
        return this;
    }

    setHighlightTint() {
        this.bodySprite.setTint(Teams[this.team].highlightTint);
        this.barrelSprite.setTint(Teams[this.team].highlightTint);
    }

    setNormalTint() {
        this.bodySprite.setTint(Teams[this.team].normalTint);
        this.barrelSprite.setTint(Teams[this.team].normalTint);
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
            this.takeBatteryDamage(2);
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
        (this.scene as MainScene).makeUpgradeGraphics(upgradeGraphics, upgrades);
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
        Object.keys(this._attr).forEach((attributeName: AttributeType) => {
            const oldValue = this._attr[attributeName];
            this._attr[attributeName] = this.upgrades.getAttribute(attributeName as AttributeType);

            if (attributeName === 'maxHP') {
                // always heal at least 10
                const healAmount = Math.max((this._attr[attributeName] - oldValue), 8);
                this.hp = Math.min(this.hp + healAmount, this._attr.maxHP);
            }
        });

        this._attr.attackInterval = Math.max(20, this._attr.attackInterval); // cap at a point

        if (doRefreshGraphics) {
            this.refreshUpgradeGraphics();
            this.updateHpBar();
        }
    }

    refreshUpgradeGraphics(): this {
        const str = `${this.upgrades.toString()}\n` +
            `HP: ${this.hp.toFixed(2)}/${this._attr.maxHP.toFixed(2)}\n` +
            `DMG: ${this._attr.damage.toFixed(2)} x ${(1000 / this._attr.attackInterval).toFixed(2)}\n` +
            `Movement: ${this._attr.movementSpeed.toFixed(2)}x\n` +
            ``;
        this.detailsText.setText(str);

        this.rangeMarker.clear();
        this.rangeMarker.lineStyle(2, 0xFFFFFF, 0.8);
        this.rangeMarker.strokeCircle(0, 0, this._attr.range);
        this.rangeMarker.lineStyle(8, 0xFFFFFF, 0.2);
        this.rangeMarker.strokeCircle(0, 0, this._attr.range - 6);

        this.barrelSprite.setScale(1 + 0.2 * this.upgrades.levels.cannon, 1 + 0.2 * this.upgrades.levels.cannon);

        this.bodySprite.setScale(Math.pow(this.upgrades.levels.chassis, 1 / 3));

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
                this.hp = Math.min(this.hp + 10, this.attr.maxHP);
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
