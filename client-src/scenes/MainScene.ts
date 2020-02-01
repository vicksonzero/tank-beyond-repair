
import * as Debug from 'debug';
import "phaser";
import { preload as _preload } from '../assets';
import { Immutable } from '../utils/ImmutableType';
import { Player } from '../entities/Player';
import { Tank } from '../entities/Tank';
import { Team } from '../entities/Team';
import { Item } from '../entities/Item';
import { GameObjects } from 'phaser';
import { IMatterContactPoints } from '../utils/utils';

type Key = Phaser.Input.Keyboard.Key;
type Container = Phaser.GameObjects.Container;

const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const log = Debug('tank-beyond-repair:MainScene:log');
// const warn = Debug('tank-beyond-repair:MainScene:warn');
// warn.log = console.warn.bind(console);


export type Controls = { up: Key, down: Key, left: Key, right: Key, action: Key };

export class MainScene extends Phaser.Scene {

    controlsList: Controls[];

    bg: Phaser.GameObjects.TileSprite;

    itemLayer: Container;
    tankLayer: Container;
    playerLayer: Container;
    effectsLayer: Container;

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

        this.itemLayer = this.add.container(0, 0);
        this.tankLayer = this.add.container(0, 0);
        this.playerLayer = this.add.container(0, 0);
        this.effectsLayer = this.add.container(0, 0);


        this.playerLayer.add(this.bluePlayer = new Player(this, Team.BLUE));
        this.bluePlayer.init(100, 100);
        this.bluePlayer.initPhysics();

        let box: Item;
        this.itemLayer.add(box = new Item(this));
        box.initPhysics();
        box.init(200, 200);

        this.playerLayer.add(this.redPlayer = new Player(this, Team.RED));
        this.redPlayer.init(1100, 700);
        this.redPlayer.initPhysics();

        const createAi = (team: Team, x: number, y: number) => {
            let ai: Tank;
            this.tankLayer.add(ai = new Tank(this, team));
            ai.init(x, y);
            ai.initPhysics();
            return ai
        }
        this.blueAi = [200, 400, 600].map((y) => {
            return createAi(Team.BLUE, 300, y);
        })
        this.redAi = [200, 400, 600].map((y) => {
            return createAi(Team.RED, 1000, y);
        })

        this.matter.world.on('collisionstart', (event: any) => this.handleCollisions(event));
        this.matter.world.on('collisionend', (event: any) => this.handleCollisionsEnd(event));
        this.setUpKeyboard();
    }

    update(time: number, dt: number) {
        const updatePlayer = (player: Player, controlsList: Controls) => {
            let xx = 0;
            let yy = 0;
            if (controlsList.up.isDown) { yy -= 3; }
            if (controlsList.down.isDown) { yy += 3; }
            if (controlsList.left.isDown) { xx -= 3; }
            if (controlsList.right.isDown) { xx += 3; }
            player.moveInDirection(xx, yy);
        }
        updatePlayer(this.bluePlayer, this.controlsList[0])
        updatePlayer(this.redPlayer, this.controlsList[1])

        const updateAi = (tank: Tank) => {
            // AI decision logic
            const direction = tank.team === Team.BLUE ? 1 : -1;
            const enemy = tank.team === Team.BLUE ?
                [this.redPlayer, ...this.redAi] : [this.bluePlayer, ...this.blueAi];

            const findTankWithClosestDistance = (myTank: Tank, enemy: (Player | Tank)[]) => {
                let minDist = Infinity;
                let target: (Player | Tank) = null;
                enemy.forEach((enemyTank) => {
                    const distance = Phaser.Math.Distance.Between(
                        myTank.x, myTank.y, enemyTank.x, enemyTank.y
                    );
                    if (distance < minDist) {
                        target = enemyTank;
                        minDist = distance;
                    }
                })
                return { target, distance: minDist }
            }
            const { target, distance } = findTankWithClosestDistance(tank, enemy)
            if (target && distance <= 250) {
                // stop and attack
                tank.setVelocityX(0);
            } else {
                // console.log(target, distance)
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

    handleCollisions(event: any) {
        //  Loop through all of the collision pairs
        const { pairs } = event;
        pairs.forEach((pair: any) => {
            const bodyA: any = pair.bodyA;
            const bodyB: any = pair.bodyB;
            const activeContacts: any = pair.activeContacts;
            const checkPairGameObjectName = this.checkPairGameObjectName_(bodyA, bodyB);

            checkPairGameObjectName('player', 'item', (a: any, b: any) => {
                (<Player>a.gameObject).onTouchingItemStart(b.gameObject as Item, activeContacts as IMatterContactPoints);
            });
            if (!(bodyA.gameObject && bodyB.gameObject)) return; // run every turn to not process dead objects

            // checkPairGameObjectName('player_bullet', 'enemy', (a: any, b: any) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
            // if (!(bodyA.gameObject && bodyB.gameObject)) return;
        });
    }

    handleCollisionsEnd(event: any) {
        //  Loop through all of the collision pairs
        const { pairs } = event;
        pairs.forEach((pair: any) => {
            const bodyA: any = pair.bodyA;
            const bodyB: any = pair.bodyB;
            const activeContacts: any = pair.activeContacts;
            const checkPairGameObjectName = this.checkPairGameObjectName_(bodyA, bodyB);

            checkPairGameObjectName('player', 'item', (a: any, b: any) => {
                (<Player>a.gameObject).onTouchingItemEnd(b.gameObject as Item, activeContacts as IMatterContactPoints);
            });
            if (!(bodyA.gameObject && bodyB.gameObject)) return; // run every turn to not process dead objects

            // checkPairGameObjectName('player_bullet', 'enemy', (a: any, b: any) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
            // if (!(bodyA.gameObject && bodyB.gameObject)) return;
        });
    }
    private checkPairGameObjectName_(bodyA: any, bodyB: any) {
        return (
            nameA: string, nameB: string,
            matchFoundCallback: (a: any, b: any) => void
        ) => {
            if (bodyA.gameObject.name === nameA && bodyB.gameObject.name === nameB) {
                matchFoundCallback(bodyA, bodyB);
            } else if (bodyB.gameObject.name === nameA && bodyA.gameObject.name === nameB) {
                matchFoundCallback(bodyB, bodyA);
            }
        }
    }
}
