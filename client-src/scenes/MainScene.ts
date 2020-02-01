
import * as Debug from 'debug';
import "phaser";
import { preload as _preload } from '../assets';
import { Immutable } from '../utils/ImmutableType';
import { Player } from '../entities/Player';
import { Tank } from '../entities/Tank';
import { Team } from '../entities/Team';
import { HpBar } from '../ui/HpBar';

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
    blueAi: Tank[];
    redPlayer: Player;
    redAi: Tank[];

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


        this.bluePlayer = <Player>this.add.existing(new Player(this, Team.BLUE))
        this.bluePlayer.init(100, 100)
            .initHpBar(new HpBar(this, 0, -25, 30, 4))
            .initPhysics();

        this.redPlayer = <Player>this.add.existing(new Player(this, Team.RED));
        this.redPlayer.init(1100, 700)
            .initHpBar(new HpBar(this, 0, -25, 30, 4))
            .initPhysics();
        this.redPlayer.initPhysics();

        const createAi = (team: Team, x: number, y: number) => {
            const ai = <Tank>this.add.existing(new Tank(this, team));
            ai.init(x, y)
                .initHpBar(new HpBar(this, 0, -25, 30, 4))
                .initPhysics();
            return ai
        }
        this.blueAi = [200, 400, 600].map((y) => {
            return createAi(Team.BLUE, 300, y);
        })
        this.redAi = [200, 400, 600].map((y) => {
            return createAi(Team.RED, 1000, y);
        })

        this.setUpKeyboard();
    }

    update(time: number, dt: number) {
        const updatePlayer = (player: Player, controlsList: Controls) => {
            let xx = 0;
            let yy = 0;
            if (controlsList.up.isDown) { yy -= 3; log(xx, yy) }
            if (controlsList.down.isDown) { yy += 3; log(xx, yy) }
            if (controlsList.left.isDown) { xx -= 3; log(xx, yy) }
            if (controlsList.right.isDown) { xx += 3; log(xx, yy) }
            player.moveInDirection(xx, yy);
        }
        updatePlayer(this.bluePlayer, this.controlsList[0])
        updatePlayer(this.redPlayer, this.controlsList[1])
        
        const updateAi = (tank: Tank) => {
            // AI decision logic
            const direction = tank.team === Team.BLUE ? 1 : -1;
            const enemy = tank.team === Team.BLUE ? 
                [this.redPlayer, ...this.redAi] : [this.bluePlayer, ...this.blueAi];

            const findTankWithClosestDistance = (myTank: Tank, enemy: (Player|Tank)[]) => {
                let minDist = Infinity;
                let target:(Player|Tank) = null;
                enemy.forEach((enemyTank) => {
                    const distance = Phaser.Math.Distance.Between(
                        myTank.x, myTank.y, enemyTank.x, enemyTank.y
                    );
                    if (distance < minDist) {
                        target = enemyTank;
                        minDist = distance;
                    }
                }) 
                return {target, distance: minDist}
            }
            const {target, distance} = findTankWithClosestDistance(tank, enemy)
            if (target && distance <= 250) {
                // stop and attack
                tank.setVelocityX(0);
            } else {
                console.log(target, distance)
                tank.setVelocityX(direction);
            }
        }
        this.blueAi.forEach((ai) => updateAi(ai))
        this.redAi.forEach((ai) => updateAi(ai))
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
