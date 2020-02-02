import {
    SPAWN_DELAY,
    SPAWN_INTERVAL,
    BASE_LINE_WIDTH,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    BULLET_SPEED,
} from '../constants'

import * as Debug from 'debug';
import "phaser";
import { preload as _preload, setUpAudio } from '../assets';
// import { Immutable } from '../utils/ImmutableType';
import { Player } from '../entities/Player';
import { Tank } from '../entities/Tank';
import { Team } from '../entities/Team';
import { Item } from '../entities/Item';
// import { GameObjects } from 'phaser';
import { IMatterContactPoints, capitalize } from '../utils/utils';
import { Bullet } from '../entities/Bullet';
import { HpBar } from '../ui/HpBar';
import { UpgradeObject, UpgradeType } from '../entities/Upgrade';
import { Time } from 'phaser';

type BaseSound = Phaser.Sound.BaseSound;
type Key = Phaser.Input.Keyboard.Key;
type Container = Phaser.GameObjects.Container;

const Vector2 = Phaser.Math.Vector2;
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const log = Debug('tank-beyond-repair:MainScene:log');
// const warn = Debug('tank-beyond-repair:MainScene:warn');
// warn.log = console.warn.bind(console);

export type Controls = { up: Key, down: Key, left: Key, right: Key, action: Key };

export class MainScene extends Phaser.Scene {

    controlsList: Controls[];
    cheats: { spawnUpgrades: Key };

    isGameOver: boolean;
    spawnTimer: Phaser.Time.TimerEvent;
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

    sfx_shoot: BaseSound;
    sfx_hit: BaseSound;
    sfx_navigate: BaseSound;
    sfx_point: BaseSound;
    sfx_open: BaseSound;
    sfx_bgm: BaseSound;


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
        setUpAudio.call(this);
        log('create');
        this.isGameOver = false;
        this.bg = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'allSprites_default', 'tileGrass1');
        this.bg.setOrigin(0, 0);
        this.bg.setAlpha(0.7);

        const leftBaseLine = new Phaser.Geom.Line(
            BASE_LINE_WIDTH,
            0,
            BASE_LINE_WIDTH,
            WORLD_HEIGHT
        );
        const rightBaseLine = new Phaser.Geom.Line(
            WORLD_WIDTH - BASE_LINE_WIDTH,
            0,
            WORLD_WIDTH - BASE_LINE_WIDTH,
            WORLD_HEIGHT
        );
        const centerLine = new Phaser.Geom.Line(
            WORLD_WIDTH / 2,
            0,
            WORLD_WIDTH / 2,
            WORLD_HEIGHT
        );
        // in Scene.update()
        this.add.graphics().lineStyle(1, 0x0000FF, 1).strokeLineShape(leftBaseLine);
        this.add.graphics().lineStyle(1, 0xFF0000, 1).strokeLineShape(rightBaseLine);
        this.add.graphics().lineStyle(1, 0xFFFFFF, 0.5).strokeLineShape(centerLine);

        const controlTexts = [];
        const controlGraphic = this.add.graphics()
        controlGraphic.lineStyle(1, 0xFFFFFF, 1);
        const creatButton = (offsetX: number, offsetY: number, letters: string[]) => {
            let i = 0;
            controlGraphic.strokeRoundedRect(offsetX + 64, offsetY + 32, 32, 32, 6);
            controlTexts.push(this.add.text(
                offsetX + 64 + 32 / 2,
                offsetY + 32 + 32 / 2,
                letters[i++],
                {
                    fontSize: '16px',
                    fill: '#FFF',
                    align: "center",
                },
            ).setOrigin(0.5));
            [32, 64, 96, 160].map((x) => {
                controlGraphic.strokeRoundedRect(offsetX + x, offsetY + 64, 32, 32, 6);
                controlTexts.push(this.add.text(
                    offsetX + x + 32 / 2,
                    offsetY + 64 + 32 / 2,
                    letters[i++],
                    {
                        fontSize: '16px',
                        fill: '#FFF',
                        align: "center",
                    },
                ).setOrigin(0.5));
            });
        };
        creatButton(150, 0, ['W', 'A', 'S', 'D', 'C']);
        creatButton(WORLD_WIDTH - 350, WORLD_HEIGHT - 150, ['↑', '←', '↓', '→', '/']);

        this.itemLayer = this.add.container(0, 0);
        this.tankLayer = this.add.container(0, 0);
        this.playerLayer = this.add.container(0, 0);
        this.effectsLayer = this.add.container(0, 0);


        this.playerLayer.add(this.bluePlayer = new Player(this, Team.BLUE));
        this.bluePlayer.spawnItem = this.spawnItem;
        this.bluePlayer.initPhysics()
            .initHpBar(new HpBar(this, 0, -25, 30, 4))
            .init(100, 100);

        this.playerLayer.add(this.redPlayer = new Player(this, Team.RED));
        this.redPlayer.spawnItem = this.spawnItem;
        this.redPlayer.initPhysics()
            .initHpBar(new HpBar(this, 0, -25, 30, 4))
            .init(WORLD_WIDTH - 100, WORLD_HEIGHT - 100)
            .faceLeft();

        const createAi = (team: Team, x: number, y: number) => {
            let ai: Tank;
            this.tankLayer.add(ai = new Tank(this, team));
            ai.initPhysics()
                .initHpBar(new HpBar(this, 0, -25, 30, 4))
                .init(x, y);
            return ai;
        };

        this.blueAi = [];
        this.redAi = [];
        const spawnCallback = () => {
            if (this.isGameOver) return;
            this.blueAi = this.blueAi.concat([200, 400, 600].map((y) => {
                return createAi(Team.BLUE, 0, Phaser.Math.RND.integerInRange(y - 50, y + 50));
            }));
            this.redAi = this.redAi.concat([200, 400, 600].map((y) => {
                return createAi(Team.RED, this.sys.game.canvas.width, Phaser.Math.RND.integerInRange(y - 50, y + 50));
            }));
        };
        this.spawnTimer = this.time.addEvent({ startAt: SPAWN_DELAY, delay: SPAWN_INTERVAL, callback: spawnCallback, loop: true, });

        this.time.addEvent({
            delay: SPAWN_DELAY,
            callback: () => {
                this.sfx_bgm.play();
            },
            loop: false,
        });
        let countDownValue = SPAWN_DELAY / 1000;
        const countDownText = this.add.text(
            WORLD_WIDTH / 2,
            WORLD_HEIGHT / 2,
            countDownValue.toString(),
            {
                fontSize: '128px',
                fill: '#FFF',
                align: "center",
            },
        ).setOrigin(0.5);
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                countDownValue -= 1;
                countDownText.setText(countDownValue.toString())
                if (countDownValue <= 0) countDownText.setVisible(false)
            },
            repeat: SPAWN_DELAY / 1000,
        })

        this.bullets = [];

        this.matter.world
            .setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
            ;
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
            player.tank?.repair();
            player.moveInDirection(xx, yy);
            player.updateAim();
            if (player.hp <= 0) {
                this.setGameOver(player.team === Team.BLUE ? Team.RED : Team.BLUE);
            }
        }
        updatePlayer(this.bluePlayer, this.controlsList[0])
        updatePlayer(this.redPlayer, this.controlsList[1])

        const detectGameOver = (tank: Tank) => {
            const isBlue = tank.team === Team.BLUE;
            if (tank.hp <= 0) return false;
            if (isBlue) {
                return tank.x > (WORLD_WIDTH - BASE_LINE_WIDTH);
            } else {
                return tank.x < BASE_LINE_WIDTH;
            }
        }
        const updateAi = (tank: Tank) => {
            // AI decision logic
            const direction = tank.team === Team.BLUE ? 1 : -1;
            const enemy = (tank.team === Team.BLUE ? [this.redPlayer, ...this.redAi]
                : [this.bluePlayer, ...this.blueAi]);

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
            if (target && distance <= tank.range) {
                // stop and attack
                const fireBullet = (tank: Tank, target: Tank | Player) => {
                    if (!tank.canFire()) return;
                    const xDiff = target.x - tank.x;
                    const yDiff = target.y - tank.y;
                    tank.setFiring({ x: xDiff, y: yDiff });
                    const bullet = <Bullet>this.add.existing(new Bullet(this, tank.team));
                    bullet.initPhysics()
                        .init(tank.x, tank.y, tank.getDamage(), tank.getRange())
                        .setVelocityX(xDiff / distance * BULLET_SPEED)
                        .setVelocityY(yDiff / distance * BULLET_SPEED);
                    this.sfx_shoot.play();
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

        const updateBullet = (bullet: Bullet) => {
            if (bullet.isOutOfRange()) {
                this.removeBullet(bullet);
            }
        };
        this.bullets.forEach((bullet) => updateBullet(bullet))
    }

    setUpKeyboard() {
        this.cheats = {
            spawnUpgrades: this.input.keyboard.addKey(KeyCodes.ZERO),
        };
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
        this.controlsList[0].action.on('down', (evt: any) => {
            this.bluePlayer.onActionPressed(this.sfx_point, this.sfx_open);
        });
        this.controlsList[1].action.on('down', (evt: any) => {
            this.redPlayer.onActionPressed(this.sfx_point, this.sfx_open);
        });
        this.cheats.spawnUpgrades.on('down', (evt: any) => {
            const upgrades = {
                range: 0,
                damage: 0,
                attackSpeed: 0,
                maxHP: 0,
                movementSpeed: 0,
            };
            const keys = Object.keys(upgrades);
            const randomUpgradeKey = (<UpgradeType>keys[keys.length * Math.random() << 0]);
            upgrades[randomUpgradeKey] += 1;
            this.spawnItem(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, upgrades, true);
        });
    }

    removeTank(tank: Tank) {
        this.blueAi = this.blueAi.filter(t => t !== tank);
        this.redAi = this.redAi.filter(t => t !== tank);

        if (this.bluePlayer.tank === tank) this.bluePlayer.tank = null;
        if (this.redPlayer.tank === tank) this.redPlayer.tank = null;

        const position = { x: tank.x, y: tank.y };
        const { upgrades } = tank;
        tank.destroy();
        this.sfx_hit.play();

        const keys = Object.keys(upgrades);
        const randomUpgradeKey = (<UpgradeType>keys[keys.length * Math.random() << 0]);
        upgrades[randomUpgradeKey] += 1;
        this.spawnItem(position.x, position.y, upgrades, true);
    }
    removeBullet(bullet: Bullet) {
        this.bullets = this.bullets.filter(b => b !== bullet);
        bullet.destroy();
    }
    handleCollisions(event: any) {
        //  Loop through all of the collision pairs
        const { pairs } = event;
        // console.log('handleCollisions', pairs.slice());
        pairs.forEach((pair: any) => {
            const bodyA: any = pair.bodyA;
            const bodyB: any = pair.bodyB;
            const activeContacts: any = pair.activeContacts;
            const checkPairGameObjectName = this.checkPairGameObjectName_(bodyA, bodyB);
            const checkPairBodyLabels = this.checkPairBodyLabels_(bodyA, bodyB);

            checkPairBodyLabels('hand', 'tank-body', (a: any, b: any) => {
                (<Player>a.player).onTouchingTankStart(a, b, activeContacts as IMatterContactPoints);
            });
            if (!pair.isSensor && !(bodyA.gameObject && bodyB.gameObject)) return; // run every turn to not process dead objects

            checkPairBodyLabels('hand', 'item-body', (a: any, b: any) => {
                (<Player>a.player).onTouchingItemStart(a, b, activeContacts as IMatterContactPoints);
            });
            if (!pair.isSensor && !(bodyA.gameObject && bodyB.gameObject)) return; // run every turn to not process dead objects

            checkPairGameObjectName('tank', 'bullet', (tank: any, bullet: any) => {
                tank.gameObject.takeDamage(bullet.gameObject.damage);
                if (tank.gameObject.hp <= 0) {
                    this.removeTank(tank.gameObject);
                }
                this.removeBullet(bullet.gameObject);
            });
            if (!pair.isSensor && !(bodyA.gameObject && bodyB.gameObject)) return; // run every turn to not process dead objects

            checkPairGameObjectName('player', 'bullet', (player: any, bullet: any) => {
                player.gameObject.takeDamage(bullet.gameObject.damage);
                player.gameObject.updateHpBar();
                this.removeBullet(bullet.gameObject);
            });
            if (!pair.isSensor && !(bodyA.gameObject && bodyB.gameObject)) return; // run every turn to not process dead objects

            // checkPairGameObjectName('player_bullet', 'enemy', (a: any, b: any) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
            // if (!(bodyA.gameObject && bodyB.gameObject)) return;
        });
    }

    handleCollisionsEnd(event: any) {
        //  Loop through all of the collision pairs
        const { pairs } = event;
        // console.log('handleCollisionsEnd', pairs.slice());

        pairs.forEach((pair: any) => {
            const bodyA: any = pair.bodyA;
            const bodyB: any = pair.bodyB;
            const activeContacts: any = pair.activeContacts;
            const checkPairGameObjectName = this.checkPairGameObjectName_(bodyA, bodyB);
            const checkPairBodyLabels = this.checkPairBodyLabels_(bodyA, bodyB);

            checkPairBodyLabels('hand', 'tank-body', (a: any, b: any) => {
                (<Player>a.player).onTouchingTankEnd(a, b, activeContacts as IMatterContactPoints);
            });
            if (!pair.isSensor && !(bodyA.gameObject && bodyB.gameObject)) return; // run every turn to not process dead objects

            checkPairBodyLabels('hand', 'item-body', (a: any, b: any) => {
                (<Player>a.player).onTouchingItemEnd(a, b, activeContacts as IMatterContactPoints);
            });
            if (!pair.isSensor && !(bodyA.gameObject && bodyB.gameObject)) return; // run every turn to not process dead objects


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

    private checkPairBodyLabels_(bodyA: any, bodyB: any) {
        // console.log(bodyA?.label, bodyB?.label);
        return (
            nameA: string, nameB: string,
            matchFoundCallback: (a: any, b: any) => void
        ) => {
            if (bodyA?.label === nameA && bodyB?.label === nameB) {
                matchFoundCallback(bodyA, bodyB);
            } else if (bodyB?.label === nameA && bodyA?.label === nameB) {
                matchFoundCallback(bodyB, bodyA);
            }
        }
    }

    setGameOver(winner: Team) {
        if (this.isGameOver) return;
        const isBlue = winner === Team.BLUE;
        if (isBlue) {
            this.redAi.forEach(ai => ai.destroy());
            this.redAi = [];
        } else {
            this.blueAi.forEach(ai => ai.destroy());
            this.blueAi = [];
        }
        this.cameras.main.shake(1000, 0.04, false);
        this.isGameOver = true;
        const height = WORLD_HEIGHT;
        const width = WORLD_WIDTH;
        this.add.text(
            width / 2,
            height / 2,
            `${capitalize(winner)} Wins!`,
            {
                fontSize: '64px',
                fill: isBlue ? '#0000FF' : '#FF0000',
                align: "center",
            },
        ).setOrigin(0.5);
    }

    spawnItem = (x: number, y: number, upgrades: UpgradeObject, isScatter = false) => {

        let box: Item;
        this.itemLayer.add(box = new Item(this));
        box.initPhysics()
            .init(x, y, upgrades)
            .setUpgrades(upgrades);
        if (isScatter) {
            const dir = Phaser.Math.RandomXY(new Vector2(1, 1), 10);
            box.setVelocity(dir.x, dir.y);

        }
        return box;
    }
}
