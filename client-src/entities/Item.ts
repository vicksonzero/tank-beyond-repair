import MatterContainer from './MatterContainer';
import * as Debug from 'debug';
import { collisionCategory } from './collisionCategory';
import { UpgradeObject, UpgradeType } from './Upgrade';
import { makeUpgradeString } from '../utils/utils';

const log = Debug('tank-beyond-repair:Item:log');
// const warn = Debug('tank-beyond-repair:Item:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;
type Text = Phaser.GameObjects.Text;


export class Item extends MatterContainer {


    static ITEM_DIE = 'item-die';
    itemSprite: Image;
    itemText: Text;

    upgrades: UpgradeObject;

    private undoTintEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, []);
        this
            .setName('item')
            ;
        this.upgrades = {
            range: 0,
            damage: 0,
            attackSpeed: 0,
            maxHP: 0,
            movementSpeed: 0,
        }

        this.add([
            this.itemSprite = this.scene.make.image({
                x: 0, y: 0,
                key: `allSprites_default`,
                frame: 'crateMetal',
            }, false),
            this.itemText = this.scene.make.text({
                x: 0, y: -20,
                text: '',
                style: {},
            })

        ]);

        this.on('destroy', () => {
            this.emit(Item.ITEM_DIE, this);
        });
    }
    init(x: number, y: number, upgrades: UpgradeObject): this {
        this
            .setX(x)
            .setY(y)
            ;
        let max = 0;
        const keys = Object.keys(upgrades);
        const randomUpgradeKey = (<UpgradeType>keys[keys.length * Math.random() << 0]);
        const {
            range,
            damage,
            attackSpeed,
            maxHP,
            movementSpeed,
        } = upgrades;
        this.upgrades = {
            range,
            damage,
            attackSpeed,
            maxHP,
            movementSpeed,
        }
        this.upgrades[randomUpgradeKey] += 1;
        return this;
    }

    initPhysics(): this {
        this.scene.matter.add.gameObject(this, (<any>this.scene.matter.bodies).rectangle(0, 0, 32, 32, { isSensor: true, label: 'item-body' }));
        this
            .setMass(1)
            .setFrictionAir(0.2)
            // .setFixedRotation()
            .setCollisionCategory(collisionCategory.WORLD)
            .setCollidesWith(collisionCategory.WORLD | collisionCategory.BLUE | collisionCategory.RED)
            ;
        return this;
    }

    moveInDirection(dirX: number, dirY: number) {
        this.setVelocity(dirX, dirY);
        this.setRotation(Math.atan2((<any>this.body).velocity.y, (<any>this.body).velocity.x));
    }

    setUpgrades(upgrades: UpgradeObject) {
        this.upgrades = { ...upgrades };

        const upgradeText = makeUpgradeString(this.upgrades);
        this.itemText.setText(upgradeText);
    }
}
