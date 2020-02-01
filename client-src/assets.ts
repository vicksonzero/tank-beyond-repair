export function preload(this: Phaser.Scene) {
    // this.load.json('sheetMap', url);

    this.load.atlasXML('allSprites_default',
        './assets/sprites/kenney_topdowntanksredux/allSprites_default.png',
        './assets/sprites/kenney_topdowntanksredux/allSprites_default.xml'
    );
    
    // this.load.image('button_close', './assets/kenney/onscreencontrols/Sprites/shadedLight/shadedLight47.png');
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