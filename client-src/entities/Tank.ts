import MatterContainer from './MatterContainer';

import { collisionCategory } from './collisionCategory';
import { capitalize } from '../utils/utils';
import { Team } from './Team';
import { HpBar } from '../ui/HpBar';
import { UpgradeObject, UpgradeType } from './Upgrade';
import { PIXEL_TO_METER, METER_TO_PIXEL } from '../constants';
import { b2Body, b2BodyType, b2CircleShape, b2FixtureDef, b2BodyDef } from '@flyover/box2d';
import { MainScene } from '../scenes/MainScene';


type Image = Phaser.GameObjects.Image;
type Graphics = Phaser.GameObjects.Graphics;
type Text = Phaser.GameObjects.Text;
type Container = Phaser.GameObjects.Container;

export class Tank extends Phaser.GameObjects.Container {

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

    b2Body: b2Body;

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


        this.bodySprite.setAngle(this.team === Team.BLUE ? 90 : -90);
        this.barrelSprite.setOrigin(0.5, 0.7);
        this.barrelSprite.setAngle(this.team === Team.BLUE ? 90 : -90);

        this.on('destroy', () => {
            this.emit(Tank.TANK_DIE, this);
        });
    }
    init(x: number, y: number): this {
        this
            .setX(x)
            .setY(y)
            ;
        this.b2Body.SetPositionXY(
            x * PIXEL_TO_METER,
            y * PIXEL_TO_METER
        );
        this.range = 250;
        this.hp = 5;
        this.maxHP = 5;
        this.damage = 1;
        this.lastFired = 0;
        this.attackSpeed = 1000;
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
        this.hpBar.updateHPBar(this.hp, this.maxHP, (this.maxHP - 5) * 2);
    }

    initPhysics(): this {
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
        bodyDef.linearDamping = 0.3; // t = ln(v' / v) / (-d) , where t=time_for_velocity_to_change (s), v and v' are velocity (m/s), d=damping
        bodyDef.fixedRotation = true;

        this.b2Body = (this.scene as MainScene).getPhysicsSystem().world.CreateBody(bodyDef);
        this.b2Body.CreateFixture(fixtureDef); // a body can have multiple fixtures


        // this.scene.matter.add.gameObject(this, { shape: { type: 'circle', radius: this.bodyRadius }, label: 'tank-body' });
        // this
        //     .setMass(1)
        //     .setFrictionAir(0.5)
        //     .setFixedRotation()
        //     .setCollisionCategory(hostCollision)
        //     .setCollidesWith(collisionCategory.WORLD | bulletCollision | collisionCategory.RED | collisionCategory.BLUE)
        //     ;
        return this;
    }

    writePhysics(): this {
        this.b2Body.SetPosition({
            x: this.x * PIXEL_TO_METER,
            y: this.y * PIXEL_TO_METER,
        });
        return this;
    }

    readPhysics(): this {
        const pos = this.b2Body.GetPosition();
        this.x = pos.x * METER_TO_PIXEL;
        this.y = pos.y * METER_TO_PIXEL;
        // this.debugText.setText(`${this.x.toFixed(2)}, ${this.y.toFixed(2)}`);
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
        Object.keys(upgrades).forEach((key: UpgradeType) => {
            this.upgrades[key] += upgrades[key];
            let value = 0;
            let level = upgrades[key];
            switch (key) {
                case 'range': value = 10; break;
                case 'damage': value = 1; break;
                case 'attackSpeed': value = -70; break;
                case 'maxHP': value = 5; break;
                case 'movementSpeed': value = 0.1; break;
                default: break;
            }
            this[key] += level * value;
        })
        // always heal at least 1
        const healAmount = Math.max(upgrades.maxHP * 5, 1);
        this.hp = Math.min(this.hp + healAmount, this.maxHP);

        this.attackSpeed = Math.max(20, this.attackSpeed); // cap at a point

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
        this.rangeMarker.lineStyle(8, 0xFFFFFF, 0.2);
        this.rangeMarker.strokeCircle(0, 0, this.range - 6);

        this.barrelSprite.setScale(1 + 0.2 * this.upgrades.damage, 1 + 0.2 * this.upgrades.range);

        return this;
    }

    setFiring({ x, y }: { x: number, y: number }) {
        this.barrelSprite.setRotation(Math.atan2(y, x) + Math.PI / 2);
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
        this.b2Body.GetFixtureList().m_filter.categoryBits = 0;
        ;
        // .setPosition(-1000, -1000);
        this.scene.cameras.main.shake(100, 0.005, false);
        super.destroy();
    }
}
