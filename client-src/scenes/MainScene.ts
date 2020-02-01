
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
import { Bullet } from '../entities/Bullet';
import { HpBar } from '../ui/HpBar';

type Key = Phaser.Input.Keyboard.Key;
type Container = Phaser.GameObjects.Container;

const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const log = Debug('tank-beyond-repair:MainScene:log');
// const warn = Debug('tank-beyond-repair:MainScene:warn');
// warn.log = console.warn.bind(console);


export type Controls = { up: Key, down: Key, left: Key, right: Key, action: Key };

export class MainScene extends Phaser.Scene {

    controlsList: Controls[];

    isGameOver: boolean;
    bg: Phaser.GameObjects.TileSprite;

    itemLayer: Container;
    tankLayer: Container;
    playerLayer: Container;
    effectsLayer: Container;

    bluePlayer: Player;
    blueAi: Tank[];
    redPlayer: Player;
    redAi: Tank[];
    bullets: Bullet[];

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
        this.isGameOver = false;
        this.bg = this.add.tileSprite(0, 0, 1366, 768, 'allSprites_default', 'tileGrass1');
        this.bg.setOrigin(0, 0);

        this.itemLayer = this.add.container(0, 0);
        this.tankLayer = this.add.container(0, 0);
        this.playerLayer = this.add.container(0, 0);
        this.effectsLayer = this.add.container(0, 0);


        this.playerLayer.add(this.bluePlayer = new Player(this, Team.BLUE));
        this.bluePlayer.init(100, 100)
            .initHpBar(new HpBar(this, 0, -25, 30, 4))
            .initPhysics();

        let box: Item;
        this.itemLayer.add(box = new Item(this));
        box.initPhysics();
        box.init(200, 200);

        this.playerLayer.add(this.redPlayer = new Player(this, Team.RED));
        this.redPlayer.init(1100, 700)
            .initHpBar(new HpBar(this, 0, -25, 30, 4))
            .initPhysics();
        this.redPlayer.initPhysics();

        const createAi = (team: Team, x: number, y: number) => {
            let ai: Tank;
            this.tankLayer.add(ai = new Tank(this, team));
            ai.init(x, y)
                .initHpBar(new HpBar(this, 0, -25, 30, 4))
                .initPhysics();
            return ai
        };
        this.blueAi = [200].map((y) => {
            return createAi(Team.BLUE, 300, y);
        });
        this.redAi = [300].map((y) => {
            return createAi(Team.RED, 1000, y);
        });

        this.bullets = [];

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

        const detectGameOver = (tank: Tank) => {
            const isBlue = tank.team === Team.BLUE;
            if (tank.hp <= 0) return false;
            if (isBlue) {
                return tank.x > this.sys.game.canvas.width;
            } else {
                return tank.x < 0;
            }
        }
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
                const fireBullet = (tank: Tank, target: Tank | Player) => {
                    if (!tank.canFire()) return;
                    tank.setFiring();
                    const bullet = <Bullet>this.add.existing(new Bullet(this, tank.team));
                    bullet.init(tank.x, tank.y, tank.getDamage());
                    bullet.initPhysics();
                    bullet.setVelocityX((target.x - tank.x) / distance);
                    bullet.setVelocityY((target.y - tank.y) / distance);
                    this.bullets.push(bullet);
                }
                fireBullet(tank, target);
                tank.setVelocityX(0);
            } else {
                tank.setVelocityX(direction);
            }
            if (detectGameOver(tank)) {
                this.setGameOver(tank.team);
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

    removeTank(tank: Tank) {
        this.blueAi = this.blueAi.filter(t => t !== tank);
        this.redAi = this.redAi.filter(t => t !== tank);
        tank.destroy();
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
            checkPairGameObjectName('tank', 'bullet', (tank: any, bullet: any) => {
                tank.gameObject.takeDamage(bullet.gameObject.damage);
                if (tank.gameObject.hp <= 0) {
                    this.removeTank(tank.gameObject);
                }
                bullet.gameObject.destroy();
            });
            checkPairGameObjectName('player', 'bullet', (player: any, bullet: any) => {
                player.gameObject.takeDamage(bullet.gameObject.damage);
                player.gameObject.updateHpBar();
                bullet.gameObject.destroy();
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
            if (bodyA?.gameObject?.name === nameA && bodyB?.gameObject?.name === nameB) {
                matchFoundCallback(bodyA, bodyB);
            } else if (bodyB?.gameObject?.name === nameA && bodyA?.gameObject?.name === nameB) {
                matchFoundCallback(bodyB, bodyA);
            }
        }
    }

    setGameOver(winner: Team) {
        if (this.isGameOver) return;
        this.isGameOver = true;
        const { height, width } = this.sys.game.canvas;
        this.add.text(width / 2 - 100, height / 2, `${winner} Wins!`, { fontSize: '64px', fill: '#fff' });
    }
}
