import * as Debug from 'debug';
import "phaser";
import { MainScene } from "./scenes/MainScene";
import './utils/window.ts';

window._Debug = Debug;
const log = Debug('ludo-plus:client:log');
// const warn = Debug('ludo-plus:client:warn');
// warn.log = console.warn.bind(console);

// main game configuration
const phaserConfig: Phaser.Types.Core.GameConfig = {
    width: 768,
    height: 1366,
    disableContextMenu: true,
    type: Phaser.AUTO,
    parent: "game",
    scene: MainScene,
    zoom: 1,
    // physics: {
    //     default: "matter",
    //     matter: {
    //         // debug: true,
    //     }
    // },
};

// game class
export class Game extends Phaser.Game {
    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }
}

// when the page is loaded, create our game instance
window.onload = () => {
    var game = new Game({ ...phaserConfig });

    // setTimeout(() => {
    // }, 100);
    function handleSizeUpdate(event?: Event) {
        const ww = window.innerWidth / Number(phaserConfig.width);
        const hh = window.innerHeight / Number(phaserConfig.height);

        const min = Math.min(ww, hh);
        log(`handleSizeUpdate\n window: ${window.innerWidth}, ${window.innerHeight}\n ratio: ${ww}, ${hh}\n min: ${min}`);

        game.canvas.style.width = `${min * Number(phaserConfig.width)}px`;
        game.canvas.style.height = `${min * Number(phaserConfig.height)}px`;
    }

    if (!window.location.search.includes('video')) {
        window.addEventListener('resize', handleSizeUpdate);

        log('init handleSizeUpdate');
        handleSizeUpdate();
    }
};
