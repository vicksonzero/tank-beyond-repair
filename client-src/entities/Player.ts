import MatterContainer from './MatterContainer';
import * as Debug from 'debug';
import { collisionCategory } from './collisionCategory';
import { capitalize, IMatterContactPoints } from '../utils/utils';
import { Team } from './Team';
import { Item } from './Item';
import { HpBar } from '../ui/HpBar';
import { Tank } from './Tank';

// const log = Debug('tank-beyond-repair:Player:log');
// const warn = Debug('tank-beyond-repair:Player:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;

export class Player extends MatterContainer {

    team: Team;
    hp: number;
    maxHP: number;
    hpBar: HpBar;

    // input
    mouseTarget?: Phaser.Input.Pointer;
    mouseOffset?: { x: number, y: number };
    followingMouse?: boolean;

    bodySprite: Image;
    barrelSprite: Image;


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
        ]);
    }
    init(x: number, y: number): this {
        this.setPosition(x, y);
        this.hp = 5;
        this.maxHP = 5;
        return this;
    }
    initHpBar(hpBar: HpBar) {
        this.add(hpBar);
        this.hpBar = hpBar;
        this.hpBar.updateHPBar(this.hp, this.maxHP);
        return this;
    }

    initPhysics(): this {
        const hostCollision = this.team === Team.BLUE ? collisionCategory.BLUE : collisionCategory.RED;
        const bulletCollison = this.team === Team.BLUE ? collisionCategory.RED_BULLET : collisionCategory.BLUE_BULLET;

        var MatterMatter = (<any>Phaser.Physics.Matter).Matter; // be careful of any!

        var circleBody = MatterMatter.Bodies.circle(0, 0, 20, { isSensor: false, label: 'body' });
        var circleHand = MatterMatter.Bodies.circle(26, 0, 12, { isSensor: true, label: 'hand' });
        const compoundBody = MatterMatter.Body.create({
            parts: [circleBody, circleHand],
            inertia: Infinity
        });
        this.scene.matter.add.gameObject(this, compoundBody);

        this
            .setMass(1)
            .setFrictionAir(0)
            .setFixedRotation()
            .setCollisionCategory(hostCollision)
            .setCollidesWith(collisionCategory.WORLD | collisionCategory.RED | collisionCategory.BLUE | bulletCollison)
            ;
        return this;
    }

    moveInDirection(dirX: number, dirY: number) {
        this.setVelocity(dirX, dirY);

        type Body = any;

        if (dirX !== 0 || dirY !== 0) {
            const rotation = Math.atan2((<any>this.body).velocity.y, (<any>this.body).velocity.x);
            const hand: Body = ((<any>this.body).parts as Array<any>).find(({ label }) => label === 'hand');
            var MatterMatter = (<any>Phaser.Physics.Matter).Matter; // be careful of any!
            MatterMatter.Body.setPosition(hand, {
                x: this.x + Math.cos(rotation) * 30,
                y: this.y + Math.sin(rotation) * 30,
            });

            this.bodySprite.setRotation(rotation);
        }
    }
    onTouchingItemStart(myBody: any, itemBody: any, activeContacts: any) {
        // a and b are bodies, but no TS definition...
        if (!itemBody.isSensor) return;
        if (myBody.label !== 'hand') return;

        const item = itemBody.gameObject as Item;
        item.itemSprite.setTint(0xAAAAAA);
    }
    onTouchingItemEnd(myBody: any, itemBody: any, activeContacts: IMatterContactPoints) {
        if (!myBody.isSensor) return;
        if (myBody.label !== 'hand') return;
        const item = itemBody.gameObject as Item;
        item.itemSprite.setTint(0xFFFFFF);
    }

    onTouchingTankStart(myBody: any, tankBody: any, activeContacts: any) {
        // a and b are bodies, but no TS definition...
        if (!myBody.isSensor) return;
        if (myBody.label !== 'hand') return;

        const tank = tankBody.gameObject as Tank;
        tank.bodySprite.setTint(0xAAAAAA);
    }

    onTouchingTankEnd(myBody: any, tankBody: any, activeContacts: IMatterContactPoints) {
        if (!myBody.isSensor) return;
        if (myBody.label !== 'hand') return;

        const tank = tankBody.gameObject as Tank;
        tank.bodySprite.setTint(0xFFFFFF);
    }

    takeDamage(amount: number): this {
        this.hp -= amount;

        this.undoTintEvent = this.scene.time.addEvent({
            delay: 200, loop: false, callback: () => {
                // some_sprite.setTint(0xAAAAAA);
            }
        });

        if (this.hp <= 0) {
            if (this.undoTintEvent) this.undoTintEvent.destroy();
            // this.gm.makeExplosion3(this.x, this.y);
            // this.gm.gameIsOver = true;
            this.visible = false;
            this
                .setCollisionCategory(0)
                ;
            // .setPosition(-1000, -1000);
            this.scene.cameras.main.shake(1000, 0.04, false);
        }
        return this;
    }
}
