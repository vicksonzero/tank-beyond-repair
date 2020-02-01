
import * as Debug from 'debug';
import "phaser";
import { Immutable } from '../utils/ImmutableType';

type Key = Phaser.Input.Keyboard.Key;
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const log = Debug('tank-beyond-repair:MainScene:log');
// const warn = Debug('tank-beyond-repair:MainScene:warn');
// warn.log = console.warn.bind(console);


export type Controls = { up: Key, down: Key, left: Key, right: Key, action: Key };

export class MainScene extends Phaser.Scene {

    controlsList: Controls[];
    scrollSpeed = 10;

    get mainCamera() { return this.sys.cameras.main; }

    constructor() {
        super({
            key: "MainScene",
        })
    }

    preload() {
        // _preload.call(this);
    }

    create(): void {

        this.setUpKeyboard();

    }

    update(time: number, dt: number) {
        // let xx = this.boardContainer.x;
        // let yy = this.boardContainer.y;
        // if (this.arrowKeys.up.isDown) yy += this.scrollSpeed;
        // if (this.arrowKeys.down.isDown) yy -= this.scrollSpeed;
        // if (this.arrowKeys.left.isDown) xx += this.scrollSpeed;
        // if (this.arrowKeys.right.isDown) xx -= this.scrollSpeed;

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
