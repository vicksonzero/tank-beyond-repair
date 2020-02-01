
import * as Debug from 'debug';
import "phaser";
import { preload as _preload } from '../assets';
import { Immutable } from '../utils/ImmutableType';
import { Player } from '../entities/Player';
import { Team } from '../entities/Team';

type Key = Phaser.Input.Keyboard.Key;
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const log = Debug('tank-beyond-repair:MainScene:log');
// const warn = Debug('tank-beyond-repair:MainScene:warn');
// warn.log = console.warn.bind(console);


export type Controls = { up: Key, down: Key, left: Key, right: Key, action: Key };

export class MainScene extends Phaser.Scene {

    controlsList: Controls[];
    scrollSpeed = 10;

    bg: Phaser.GameObjects.TileSprite;
    bluePlayer: Player;
    redPlayer: Player;

    get mainCamera() { return this.sys.cameras.main; }

    constructor() {
        super({
            key: "MainScene",
        })
    }

    preload() {
        log('preload');
        _preload.call(this);
    }

    create(): void {
        log('create');
        this.bg = this.add.tileSprite(0, 0, 1366, 768, 'allSprites_default', 'tileGrass1');
        this.bg.setOrigin(0, 0);


        this.bluePlayer = <Player>this.add.existing(new Player(this, Team.BLUE));
        this.bluePlayer.init(100, 100);
        this.bluePlayer.initPhysics();

        this.setUpKeyboard();
    }

    update(time: number, dt: number) {
        const updatePlayer = (player: Player, controlsList: Controls) => {
            let xx = 0;
            let yy = 0;
            if (controlsList.up.isDown) { yy -= 10; log(xx, yy) }
            if (controlsList.down.isDown) { yy += 10; log(xx, yy) }
            if (controlsList.left.isDown) { xx -= 10; log(xx, yy) }
            if (controlsList.right.isDown) { xx += 10; log(xx, yy) }
            player.setVelocity(xx, yy);
        }
        updatePlayer(this.bluePlayer, this.controlsList[0])
    }

    setUpKeyboard() {
        this.controlsList = [
            {
                up: this.input.keyboard.addKey(KeyCodes.W),
                down: this.input.keyboard.addKey(KeyCodes.S),
                left: this.input.keyboard.addKey(KeyCodes.A),
                right: this.input.keyboard.addKey(KeyCodes.D),
                action: this.input.keyboard.addKey(KeyCodes.C),
            },
            {
                up: this.input.keyboard.addKey(KeyCodes.UP),
                down: this.input.keyboard.addKey(KeyCodes.DOWN),
                left: this.input.keyboard.addKey(KeyCodes.LEFT),
                right: this.input.keyboard.addKey(KeyCodes.RIGHT),
                action: this.input.keyboard.addKey(KeyCodes.FORWARD_SLASH),
            }
        ];

    }
}
