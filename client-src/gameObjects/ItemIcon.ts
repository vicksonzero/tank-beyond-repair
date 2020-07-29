import * as Debug from 'debug';
import { GameObjects } from 'phaser';
import { MainScene } from '../scenes/MainScene';

const log = Debug('tank-beyond-repair:ItemIcon:log');
// const warn = Debug('tank-beyond-repair:ItemIcon:warn');
// warn.log = console.warn.bind(console);

type Image = GameObjects.Image;
type Text = GameObjects.Text;




export class ItemIcon extends GameObjects.Container {
    scene: MainScene;
    itemSprite: Image;
    itemText: Text;

    date = 0;

    constructor(scene: MainScene) {
        super(scene, 0, 0, []);
        this
            .setName('ItemIcon')
            ;

        this.add([
            this.itemSprite = this.scene.make.image({
                x: 0, y: 0,
                key: `items_icon`,
            }, false),
            this.itemText = this.scene.make.text({
                x: 0, y: 0,
                text: '',
                style: {
                    align: 'left',
                    color: '#000000',
                    fontSize: 24,
                    fontWeight: 800,
                    fontFamily: 'Arial',
                },
            }, false).setName('iconLabel'),
        ]);

        
        this.itemSprite.setOrigin(0.5);
    }

}
