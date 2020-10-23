import { AUDIO_START_MUTED } from "./constants";
import { Explosion } from "./gameObjects/Explosion";
import { ItemIcon } from "./gameObjects/ItemIcon";
import { MainScene } from "./scenes/MainScene";
import * as Debug from 'debug';

type Group = Phaser.GameObjects.Group;


const verbose = Debug('tank-beyond-repair:assets:verbose');
const log = Debug('tank-beyond-repair:assets:log');
// const warn = Debug('tank-beyond-repair:assets:warn');
// warn.log = console.warn.bind(console);


export function preload(this: Phaser.Scene) {
    log('preload');
    // this.load.json('sheetMap', url);

    this.load.atlasXML('allSprites_default',
        './assets/sprites/kenney_topdowntanksredux/allSprites_default.png',
        './assets/sprites/kenney_topdowntanksredux/allSprites_default.xml'
    );

    this.load.image('manBlue_hold', './assets/sprites/topdown-shooter/PNG/manBlue_hold.png');
    this.load.image('manRed_hold', './assets/sprites/topdown-shooter/PNG/manRed_hold.png');
    this.load.image('repair', './assets/sprites/kenney_emotespack/PNG/Vector/Style 8/emote_heart.png');
    this.load.image('btn_mute_dark', './assets/sprites/onscreencontrols/Sprites/transparentLight/transparentLight15.png');
    this.load.image('btn_mute_light', './assets/sprites/onscreencontrols/Sprites/transparentLight/transparentLight17.png');
    this.load.image('factory_frame', './assets/sprites/dicksonmd/Factory-frame.png');
    this.load.image('factory_door', './assets/sprites/dicksonmd/Factory-door.png');

    this.load.atlas('items_icon',
        './assets/sprites/dicksonmd/spritesheet (1).png',
        './assets/sprites/dicksonmd/spritesheet (1).json'
    );

    this.load.audio('bgm', './assets/sfx/04 All of Us.mp3');
    this.load.audio('point', './assets/sfx/270304__littlerobotsoundfactory__collect-point-00.wav');
    this.load.audio('navigate', './assets/sfx/270315__littlerobotsoundfactory__menu-navigate-03.wav');
    this.load.audio('hit', './assets/sfx/270332__littlerobotsoundfactory__hit-03.wav');
    this.load.audio('open', './assets/sfx/270338__littlerobotsoundfactory__open-01.wav');
    this.load.audio('shoot', './assets/sfx/270343__littlerobotsoundfactory__shoot-01.wav');
}

export function setUpAnimations(this: Phaser.Scene) {
    log('setUpAnimations');
    this.anims.create({
        key: 'explosion',
        frames: this.anims.generateFrameNames(
            'allSprites_default',
            {
                prefix: 'explosion',
                start: 1,
                end: 5,

            },
        ),
        repeat: 0,
        frameRate: 10,
    });
}

export function setUpPools(this: MainScene) {
    log('setUpPools');
    this.iconPool = this.add.group({
        classType: ItemIcon,
        runChildUpdate: false,
        name: 'pool-item-icon',
        createCallback: function (this: Group, entity: ItemIcon) {
            entity.setName(`${this.name}-${this.getLength()}`);
            // console.log(`${this.name}: ${this.getLength()} Created`);
        },
        removeCallback: function (this: Group, entity: ItemIcon) {
            // place holder
            // console.log(`${this.name}: Removed`);
            // debugger; // uncomment to debug accidental destroys instead of .setActive(false).setVisible(false)
        }
    });
    this.explosionPool = this.add.group({
        classType: Explosion,
        runChildUpdate: false,
        name: 'pool-effect-explosion',
        createCallback: function (this: Group, entity: ItemIcon) {
            entity.setName(`${this.name}-${this.getLength()}`);
            // console.log(`${this.name}: ${this.getLength()} Created`);
        },
        removeCallback: function (this: Group, entity: ItemIcon) {
            // place holder
            // console.log(`${this.name}: Removed`);
            // debugger; // uncomment to debug accidental destroys instead of .setActive(false).setVisible(false)
        }
    });
}

export function setUpAudio(this: MainScene) {
    log('setUpAudio');
    this.sfx_bgm = this.sound.add('bgm', {
        mute: false,
        volume: 0.7,
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
        volume: 0.7,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0
    });
    this.sfx_navigate = this.sound.add('navigate', {
        mute: false,
        volume: 0.8,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0
    });
    this.sfx_point = this.sound.add('point', {
        mute: false,
        volume: 0.8,
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

    this.sound.mute = AUDIO_START_MUTED;
}