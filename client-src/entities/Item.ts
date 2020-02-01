import MatterContainer from './MatterContainer';
import * as Debug from 'debug';
import { collisionCategory } from './collisionCategory';

const log = Debug('tank-beyond-repair:Item:log');
// const warn = Debug('tank-beyond-repair:Item:warn');
// warn.log = console.warn.bind(console);

type Image = Phaser.GameObjects.Image;
type Text = Phaser.GameObjects.Text;


export type UpgradeDef = { [x: string]: integer };

export class Item extends MatterContainer {


    static ITEM_DIE = 'item-die';
    itemSprite: Image;
    itemText: Text;
    upgrades: UpgradeDef = { 'dummy': Math.floor(Math.random() * 100) };


    private undoTintEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, []);
        this
            .setName('item')
            ;

        this.add([
            this.itemSprite = this.scene.make.image({
                x: 0, y: 0,
                key: `allSprites_default`,
                frame: 'crateMetal',
            }, false),
            this.itemText = this.scene.make.text({
                x: 0, y: -10,
                text: '',
                style: {},
            })

        ]);

        this.on('destroy', () => {
            console.log('hi die');
            this.emit(Item.ITEM_DIE)
        });
    }
    init(x: number, y: number): this {
        this
            .setX(x)
            .setY(y)
            ;
        return this;
    }

    initPhysics(): this {
        this.scene.matter.add.gameObject(this, (<any>this.scene.matter.bodies).rectangle(0, 0, 32, 32, { isSensor: true, label: 'left' }));
        this
            .setMass(1)
            .setFrictionAir(0.7)
            .setFixedRotation()
            .setCollisionCategory(collisionCategory.WORLD)
            .setCollidesWith(collisionCategory.WORLD | collisionCategory.BLUE | collisionCategory.RED)
            ;
        return this;
    }

    moveInDirection(dirX: number, dirY: number) {
        this.setVelocity(dirX, dirY);
        this.setRotation(Math.atan2((<any>this.body).velocity.y, (<any>this.body).velocity.x));
    }

    setUpgrades(upgrades: UpgradeDef) {
        this.upgrades = { ...upgrades };

        const upgradeText = (Object.entries(this.upgrades)
            .map(([key, value]) => `${key}${(value >= 0 ? '+' + value : value)}`)
            .join('\n')
        );
        this.itemText.setText(upgradeText);
    }
}
