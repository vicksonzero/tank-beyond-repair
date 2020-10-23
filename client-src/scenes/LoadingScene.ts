import { preload } from "../assets";
import { MainScene } from "./MainScene";

import * as Debug from 'debug';

const verbose = Debug('tank-beyond-repair:LoadingScene:verbose');
const log = Debug('tank-beyond-repair:LoadingScene:log');
// const warn = Debug('tank-beyond-repair:LoadingScene:warn');
// warn.log = console.warn.bind(console);

export class LoadingScene extends Phaser.Scene {
    bgGraphics: Phaser.GameObjects.Graphics;
    graphics: Phaser.GameObjects.Graphics;
    newGraphics: Phaser.GameObjects.Graphics;
    loadingText: any;
    width: number = 600;
    height: number = 50;
    padding: number = 5;
    bgColor: number = 0x000000;
    barBgColor: number = 0xffffff;
    barColor: number = 0x35e29a;


    preload() {
        this.bgGraphics = this.add.graphics();
        this.graphics = this.add.graphics();
        this.newGraphics = this.add.graphics();

        var progressBar = new Phaser.Geom.Rectangle(
            +this.sys.game.config.width / 2 - this.width / 2,
            +this.sys.game.config.height / 2 - this.height / 2,
            this.width,
            this.height
        );
        var progressBarFill = new Phaser.Geom.Rectangle(
            +this.sys.game.config.width / 2 - this.width / 2 + this.padding,
            +this.sys.game.config.height / 2 - this.height / 2 + this.padding,
            this.width - this.padding * 2,
            this.height - this.padding * 2
        );

        this.bgGraphics.fillStyle(this.bgColor, 1);
        this.bgGraphics.fillRect(0, 0, +this.sys.game.config.width, +this.sys.game.config.height);

        this.graphics.fillStyle(this.barBgColor, 1);
        this.graphics.fillRectShape(progressBar);

        this.newGraphics.fillStyle(this.barColor, 1);
        this.newGraphics.fillRectShape(progressBarFill);

        this.loadingText = this.add.text(
            +this.sys.game.config.width / 2 - this.width / 2,
            +this.sys.game.config.height / 2 + this.height / 2 + this.padding,
            "Loading: ",
            { fontSize: '32px', fill: '#FFF' }
        );

        preload.apply(this);

        this.load.on('progress', (percentage: number) => this.updateBar(percentage));
        this.load.on('complete', () => this.complete());
    }

    updateBar(percentage: number) {
        this.newGraphics.clear();
        this.newGraphics.fillStyle(this.barColor, 1);
        this.newGraphics.fillRectShape(new Phaser.Geom.Rectangle(
            +this.sys.game.config.width / 2 - this.width / 2 + this.padding,
            +this.sys.game.config.height / 2 - this.height / 2 + this.padding,
            (this.width - this.padding * 2) * percentage,
            this.height - this.padding * 2
        ));

        percentage = percentage * 100;
        this.loadingText.setText("Loading: " + percentage.toFixed(2) + "%");
        log("P:" + percentage);
    }
    complete() {
        log("COMPLETE!");
        this.scene.start(MainScene.name);
    }
}
