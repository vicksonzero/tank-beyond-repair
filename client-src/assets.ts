export function preload(this: Phaser.Scene) {
    // this.load.json('sheetMap', url);

    this.load.atlasXML('allSprites_default',
        './assets/sprites/kenney_topdowntanksredux/allSprites_default.png',
        './assets/sprites/kenney_topdowntanksredux/allSprites_default.xml'
    );
    
    this.load.image('manBlue_hold', './assets/sprites/topdown-shooter/PNG/manBlue_hold.png');
    this.load.image('manRed_hold', './assets/sprites/topdown-shooter/PNG/manRed_hold.png');
    this.load.image('repair', './assets/sprites/kenney_emotespack/PNG/Vector/Style 1/emote_heart.png');
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