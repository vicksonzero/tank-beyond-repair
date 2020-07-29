import * as Debug from 'debug';
import { GameObjects } from 'phaser';
import { MainScene } from '../scenes/MainScene';

const log = Debug('tank-beyond-repair:Explosion:log');
// const warn = Debug('tank-beyond-repair:Explosion:warn');
// warn.log = console.warn.bind(console);

type Image = GameObjects.Image;
type Sprite = GameObjects.Sprite;




export class Explosion extends GameObjects.Container {
    scene: MainScene;
    itemSprite: Sprite;

    constructor(scene: MainScene) {
        super(scene, 0, 0, []);
        this
            .setName('explosion')
            ;

        this.add([
            this.itemSprite = this.scene.make.sprite({
                x: 0, y: 0,
                key: `allSprites_default`,
                frame: 'explosion1',
            }, false),
        ]);
    }

    playExplosion(): this {
        this.itemSprite.on('animationcomplete', () => {
            this.destroy();
        });
        this.itemSprite.play('explosion');

        return this;
    }
}
