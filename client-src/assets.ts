import { MainScene } from "./scenes/MainScene";

export function preload(this: Phaser.Scene) {
    // this.load.json('sheetMap', url);

    this.load.atlasXML('allSprites_default',
        './assets/sprites/kenney_topdowntanksredux/allSprites_default.png',
        './assets/sprites/kenney_topdowntanksredux/allSprites_default.xml'
    );

    this.load.image('manBlue_hold', './assets/sprites/topdown-shooter/PNG/manBlue_hold.png');
    this.load.image('manRed_hold', './assets/sprites/topdown-shooter/PNG/manRed_hold.png');
    this.load.image('repair', './assets/sprites/kenney_emotespack/PNG/Vector/Style 8/emote_heart.png');

    this.load.audio('bgm', './assets/sfx/04 All of Us.mp3');
    this.load.audio('point', './assets/sfx/270304__littlerobotsoundfactory__collect-point-00.wav');
    this.load.audio('navigate', './assets/sfx/270315__littlerobotsoundfactory__menu-navigate-03.wav');
    this.load.audio('hit', './assets/sfx/270332__littlerobotsoundfactory__hit-03.wav');
    this.load.audio('open', './assets/sfx/270338__littlerobotsoundfactory__open-01.wav');
    this.load.audio('shoot', './assets/sfx/270343__littlerobotsoundfactory__shoot-01.wav');
}

export function setUpAnimations(this: Phaser.Scene) {
    // this.anims.create({
    //     key: 'player_idle',
    //     frames: this.anims.generateFrameNames(
    //         'platformercharacters_Player',
    //         { frames: [0] }
    //     ),
    //     repeat: 0,
    //     frameRate: 1
    // });
}

export function setUpAudio(this: MainScene) {
    this.sfx_bgm = this.sound.add('bgm', {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true, // loop!!!
        delay: 0
    });
    this.sfx_shoot = this.sound.add('shoot', {
        mute: false,
        volume: 0.4,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0
    });
    this.sfx_hit = this.sound.add('hit', {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0
    });
    this.sfx_navigate = this.sound.add('navigate', {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0
    });
    this.sfx_point = this.sound.add('point', {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0
    });
    this.sfx_open = this.sound.add('open', {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0
    });


}