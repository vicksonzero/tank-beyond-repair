import { b2Contact, b2ContactImpulse, b2ContactListener, b2Fixture, b2Manifold, b2ParticleBodyContact, b2ParticleContact, b2ParticleSystem, b2Shape } from '@flyover/box2d';
import * as Debug from 'debug';
import "phaser";
import { GameObjects } from 'phaser';
import { preload as _preload, setUpAudio } from '../assets';
import { config, ItemType } from '../config/config';
import { BASE_LINE_WIDTH, BULLET_SPEED, DEBUG_DISABLE_SPAWNING, DEBUG_PHYSICS, PHYSICS_FRAME_SIZE, PHYSICS_MAX_FRAME_CATCHUP, PIXEL_TO_METER, PLAYER_MOVE_SPEED, SPAWN_DELAY, SPAWN_INTERVAL, TANK_CHASE_ITEM_RANGE, TANK_SPEED, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { Bullet } from '../entities/Bullet';
import { Item } from '../entities/Item';
// import { Immutable } from '../utils/ImmutableType';
import { Player } from '../entities/Player';
import { Tank } from '../entities/Tank';
import { Team } from '../entities/Team';
import { UpgradeObject } from '../entities/Upgrade';
import { IBodyUserData, IFixtureUserData, PhysicsSystem } from '../PhysicsSystem';
import { HpBar } from '../ui/HpBar';
import { DistanceMatrix } from '../utils/DistanceMatrix';
// import { GameObjects } from 'phaser';
import { capitalize, lerpRadians } from '../utils/utils';


type BaseSound = Phaser.Sound.BaseSound;
type Key = Phaser.Input.Keyboard.Key;
type Container = Phaser.GameObjects.Container;
type Graphics = Phaser.GameObjects.Graphics;
type Image = Phaser.GameObjects.Image;

const Vector2 = Phaser.Math.Vector2;
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const verbose = Debug('tank-beyond-repair:MainScene:verbose');
const log = Debug('tank-beyond-repair:MainScene:log');
// const warn = Debug('tank-beyond-repair:MainScene:warn');
// warn.log = console.warn.bind(console);

export type Controls = { up: Key, down: Key, left: Key, right: Key, action: Key };

export class MainScene extends Phaser.Scene implements b2ContactListener {

    controlsList: Controls[];
    cheats: { spawnUpgrades: Key };

    isGameOver: boolean;
    spawnTimer: Phaser.Time.TimerEvent;
    bg: Phaser.GameObjects.TileSprite;

    backgroundUILayer: Container;
    itemLayer: Container;
    tankLayer: Container;
    playerLayer: Container;
    effectsLayer: Container;
    uiLayer: Container;
    physicsDebugLayer: Graphics;

    btn_mute: Image;

    bluePlayer: Player;
    redPlayer: Player;
    readonly blueAi: Tank[] = [];
    readonly redAi: Tank[] = [];
    readonly bullets: Bullet[] = [];
    readonly items: Item[] = [];
    readonly instancesByID: { [id: number]: (GameObjects.Container) } = {};

    sfx_shoot: BaseSound;
    sfx_hit: BaseSound;
    sfx_navigate: BaseSound;
    sfx_point: BaseSound;
    sfx_open: BaseSound;
    sfx_bgm: BaseSound;

    frameSize = PHYSICS_FRAME_SIZE; // ms
    lastUpdate = -1;
    distanceMatrix: DistanceMatrix;

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
        this.getPhysicsSystem().init(this as b2ContactListener);
        this.distanceMatrix = new DistanceMatrix();
        this.isGameOver = false;
        this.bg = this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'allSprites_default', 'tileGrass1');
        this.bg.setOrigin(0, 0);
        this.bg.setAlpha(0.7);

        this.backgroundUILayer = this.add.container(0, 0);
        this.itemLayer = this.add.container(0, 0);
        this.tankLayer = this.add.container(0, 0);
        this.playerLayer = this.add.container(0, 0);
        this.effectsLayer = this.add.container(0, 0);
        this.uiLayer = this.add.container(0, 0);
        this.physicsDebugLayer = this.add.graphics({ lineStyle: { color: 0x000000, width: 1, alpha: 1 } });
        this.uiLayer.add(this.physicsDebugLayer);


        this.playerLayer.add(this.bluePlayer = new Player(this, Team.BLUE));
        this.instancesByID[this.bluePlayer.uniqueID] = this.bluePlayer;
        this.bluePlayer.spawnItem = this.spawnItem;
        this.bluePlayer
            .initHpBar(new HpBar(this, 0, -30, 30, 4, 2))
            .init(100, 100);
        this.bluePlayer.initPhysics(() => { });

        this.playerLayer.add(this.redPlayer = new Player(this, Team.RED));
        this.instancesByID[this.redPlayer.uniqueID] = this.redPlayer;
        this.redPlayer.spawnItem = this.spawnItem;
        this.redPlayer
            .initHpBar(new HpBar(this, 0, -30, 30, 4, 2))
            .init(WORLD_WIDTH - 100, WORLD_HEIGHT - 100)
            .faceLeft();
        this.redPlayer.initPhysics(() => { });

        const createAi = (team: Team, x: number, y: number) => {
            let ai: Tank;
            this.tankLayer.add(ai = new Tank(this, team));
            ai
                .initHpBar(new HpBar(this, 0, -30, 30, 4, 2))
                .init(x, y);
            ai.initPhysics(() => { });

            const list = team === Team.BLUE ? this.blueAi : this.redAi;
            this.addToList(ai, list);
            return ai;
        };

        if (!DEBUG_DISABLE_SPAWNING) {
            const spawnCallback = () => {
                if (this.isGameOver) return;
                [200, 400, 600].forEach((y) => {
                    createAi(Team.BLUE, 0, Phaser.Math.RND.integerInRange(y - 50, y + 50));
                });
                [200, 400, 600].map((y) => {
                    createAi(Team.RED, this.sys.game.canvas.width, Phaser.Math.RND.integerInRange(y - 50, y + 50));
                });
            };

            this.spawnTimer = this.time.addEvent({
                startAt: SPAWN_DELAY,
                delay: SPAWN_INTERVAL,
                callback: spawnCallback,
                loop: true,
            });
        }
        for (let i = 0; i < 10; i++) {
            const dir = Phaser.Math.RandomXY(new Vector2(1, 1), 10);
            dir.scale(10);
            const pos = new Vector2(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
            pos.add(dir);
            const upgrades = UpgradeObject.getRandomPartFromPool(5);

            const randomUpgrade2 = UpgradeObject.getRandomPartFromPool(5);
            upgrades.addParts(randomUpgrade2.partsList);
            // const upgrades = new UpgradeObject();
            // upgrades.setParts({ battery: Math.floor(Math.random() * i * 100) + 1 });
            this.spawnItem(pos.x, pos.y, upgrades, true);
        }

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
                if (countDownValue <= 0) { countDownText.setVisible(false); }
            },
            repeat: SPAWN_DELAY / 1000,
        });

        this.setUpGUI();
        this.setUpKeyboard();
        log('create complete');
    }

    update(time: number, dt: number) {
        // verbose(`update ${time}`);

        const lastGameTime = this.lastUpdate;
        // log(`update (from ${lastGameTime} to ${gameTime})`);

        if (this.lastUpdate === -1) {
            this.lastUpdate = time;

            const timeStep = 1000 / this.frameSize; // seconds
            this.fixedUpdate(timeStep);
        } else {
            let i = 0;
            while (this.lastUpdate + this.frameSize < time && i < PHYSICS_MAX_FRAME_CATCHUP) {
                i++;

                const timeStep = 1000 / this.frameSize; // seconds
                this.fixedUpdate(timeStep);
                this.lastUpdate += this.frameSize;
            }

            // verbose(`update: ${i} fixedUpdate-ticks at ${time.toFixed(3)} (from ${lastGameTime.toFixed(3)} to ${this.lastUpdate.toFixed(3)})`);
        }
    }

    fixedUpdate(timeStep: number) {
        // verbose(`fixedUpdate start`);

        this.getPhysicsSystem().update(
            timeStep,
            (DEBUG_PHYSICS ? this.physicsDebugLayer : undefined)
        );
        this.distanceMatrix.init([this.bluePlayer, this.redPlayer, ...this.blueAi, ...this.redAi, ...this.items]);
        this.updatePlayers();
        this.updateAi();

        const updateBullet = (bullet: Bullet) => {
            if (bullet.isOutOfRange()) {
                this.removeBullet(bullet);
            }
        };
        this.bullets.forEach((bullet) => updateBullet(bullet));
        // verbose(`fixedUpdate complete`);
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
            const upgrades = UpgradeObject.getRandomPartFromPool(10);
            this.spawnItem(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, upgrades, true);
        });
    }

    setUpGUI() {
        const quarterWidth = (WORLD_WIDTH - 2 * BASE_LINE_WIDTH) / 4
        const leftBaseLine = new Phaser.Geom.Line(
            BASE_LINE_WIDTH,
            0,
            BASE_LINE_WIDTH,
            WORLD_HEIGHT
        );
        const leftQuarterLine = new Phaser.Geom.Line(
            BASE_LINE_WIDTH + quarterWidth,
            0,
            BASE_LINE_WIDTH + quarterWidth,
            WORLD_HEIGHT
        );
        const rightBaseLine = new Phaser.Geom.Line(
            WORLD_WIDTH - BASE_LINE_WIDTH,
            0,
            WORLD_WIDTH - BASE_LINE_WIDTH,
            WORLD_HEIGHT
        );
        const rightQuarterLine = new Phaser.Geom.Line(
            WORLD_WIDTH - BASE_LINE_WIDTH - quarterWidth,
            0,
            WORLD_WIDTH - BASE_LINE_WIDTH - quarterWidth,
            WORLD_HEIGHT
        );
        const centerLine = new Phaser.Geom.Line(
            WORLD_WIDTH / 2,
            0,
            WORLD_WIDTH / 2,
            WORLD_HEIGHT
        );

        this.backgroundUILayer.add(this.add.graphics()
            .lineStyle(1, 0x0000FF, 1)
            .strokeLineShape(leftBaseLine)
        );
        this.backgroundUILayer.add(this.add.graphics()
            .lineStyle(1, 0xDCDCDC, 1)
            .strokeLineShape(leftQuarterLine)
        );
        this.backgroundUILayer.add(this.add.graphics()
            .lineStyle(1, 0xFFFFFF, 0.5)
            .strokeLineShape(centerLine)
        );
        this.backgroundUILayer.add(this.add.graphics()
            .lineStyle(1, 0xDCDCDC, 1)
            .strokeLineShape(rightQuarterLine)
        );
        this.backgroundUILayer.add(this.add.graphics()
            .lineStyle(1, 0xFF0000, 1)
            .strokeLineShape(rightBaseLine)
        );

        const controlTexts: Phaser.GameObjects.Text[] = [];
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
        this.backgroundUILayer.add(controlGraphic);
        this.backgroundUILayer.add(controlTexts);

        this.uiLayer.add([
            this.btn_mute = this.add.image(WORLD_WIDTH - 64, 64, `btn_mute_${!this.sound.mute ? 'dark' : 'light'}`),
        ]);

        this.btn_mute.setInteractive();
        this.btn_mute.on('pointerup', () => {
            this.sound.mute = !this.sound.mute;
            this.btn_mute.setTexture(`btn_mute_${this.sound.mute ? 'dark' : 'light'}`);
        });
    }

    removeTank(tank: Tank) {
        if (this.bluePlayer.tank === tank) this.bluePlayer.tank = null;
        if (this.redPlayer.tank === tank) this.redPlayer.tank = null;

        const position = { x: tank.x, y: tank.y };
        const { upgrades } = tank;
        tank.destroy();
        this.sfx_hit.play();

        const randomUpgrade = UpgradeObject.getRandomPartFromPool(1);
        upgrades.addParts(randomUpgrade.partsList);

        Object.entries(upgrades.partsList).forEach(([partName, level]) => {
            const u = new UpgradeObject();
            u.setParts({
                [partName]: Math.ceil(level* 0.5),
            });
            this.spawnItem(position.x, position.y, u, true);
        })
    }

    removeBullet(bullet: Bullet) {
        // log('removeBullet');
        bullet.destroy();
    }


    public BeginContact(pContact: b2Contact<b2Shape, b2Shape>): void {
        for (let contact: b2Contact<b2Shape, b2Shape> | null = pContact; contact != null; contact = contact.GetNext()) {
            if (!contact) { continue; } // satisfy eslint
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();

            const fixtureDataA: IFixtureUserData = contact.GetFixtureA()?.GetUserData();
            const fixtureDataB: IFixtureUserData = contact.GetFixtureB()?.GetUserData();

            const bodyDataA: IBodyUserData = fixtureA.GetBody()?.GetUserData();
            const bodyDataB: IBodyUserData = fixtureB.GetBody()?.GetUserData();

            const gameObjectA = fixtureA.GetBody()?.GetUserData()?.gameObject;
            const gameObjectB = fixtureB.GetBody()?.GetUserData()?.gameObject;
            // log(`BeginContact ` +
            //     `${bodyDataA?.label}(${gameObjectA?.uniqueID})'s ${fixtureDataA?.fixtureLabel}` +
            //     ` vs ` +
            //     `${bodyDataB?.label}(${gameObjectB?.uniqueID})'s ${fixtureDataB?.fixtureLabel}`
            // );

            const checkPairGameObjectName = this.checkPairGameObjectName_(fixtureA, fixtureB);
            const checkPairFixtureLabels = this.checkPairFixtureLabels_(fixtureA, fixtureB);

            // checkPairFixtureLabels('player-hand', 'tank-body', (a: b2Fixture, b: b2Fixture) => {
            //     log('do contact 1');
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingTankStart(a, b, contact!);
            // });
            // if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
            //     log('gone 1');
            //     continue;
            // }

            // checkPairFixtureLabels('player-hand', 'item-body', (a: b2Fixture, b: b2Fixture) => {
            //     log('do contact 2');
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingItemStart(a, b, contact!);
            // });
            // if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
            //     log('gone 2');
            //     continue;
            // }

            checkPairGameObjectName('tank', 'item', (tankFixture: b2Fixture, itemFixture: b2Fixture) => {
                // log('do contact 3');
                const tank: Tank = tankFixture.GetBody()?.GetUserData()?.gameObject as Tank;
                const item: Item = itemFixture.GetBody()?.GetUserData()?.gameObject as Item;
                if (item.upgrades) { tank.setUpgrade(item.upgrades); }

                this.sfx_point.play();
                item.destroy();
            });
            if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
                // log('gone 3');
                continue;
            }

            checkPairGameObjectName('tank', 'bullet', (tankFixture: b2Fixture, bulletFixture: b2Fixture) => {
                // log('do contact 3');
                const tank: Tank = tankFixture.GetBody()?.GetUserData()?.gameObject as Tank;
                const bullet: Bullet = bulletFixture.GetBody()?.GetUserData()?.gameObject as Bullet;
                tank.takeDamage(bullet.damage);
                if (tank.hp <= 0) {
                    this.removeTank(tank);
                }
                this.removeBullet(bullet);
            });
            if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
                // log('gone 3');
                continue;
            }

            checkPairFixtureLabels('player-body', 'bullet-body', (playerFixture: b2Fixture, bulletFixture: b2Fixture) => {
                // log('do contact 4');
                const player: Player = playerFixture.GetBody()?.GetUserData()?.gameObject as Player;
                const bullet: Bullet = bulletFixture.GetBody()?.GetUserData()?.gameObject as Bullet;
                player.takeDamage(bullet.damage);
                player.updateHpBar();
                this.removeBullet(bullet);
            });
            if (fixtureA.GetBody()?.GetUserData()?.gameObject == null || fixtureB.GetBody()?.GetUserData()?.gameObject == null) {
                // log('gone 4');
                continue;
            }

            // checkPairGameObjectName('player_bullet', 'enemy', (a: b2Fixture, b: b2Fixture) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
        }
    }
    public EndContact(pContact: b2Contact<b2Shape, b2Shape>): void {
        for (let contact: b2Contact<b2Shape, b2Shape> | null = pContact; contact != null; contact = contact.GetNext()) {
            if (!contact) { continue; } // satisfy eslint
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();

            const fixtureDataA: IFixtureUserData = contact.GetFixtureA()?.GetUserData();
            const fixtureDataB: IFixtureUserData = contact.GetFixtureB()?.GetUserData();

            const bodyDataA: IBodyUserData = fixtureA.GetBody()?.GetUserData();
            const bodyDataB: IBodyUserData = fixtureB.GetBody()?.GetUserData();

            const gameObjectA = fixtureA.GetBody()?.GetUserData()?.gameObject;
            const gameObjectB = fixtureB.GetBody()?.GetUserData()?.gameObject;
            // log(`EndContact ` +
            //     `${bodyDataA?.label}(${gameObjectA?.uniqueID})'s ${fixtureDataA?.fixtureLabel}` +
            //     ` vs ` +
            //     `${bodyDataB?.label}(${gameObjectB?.uniqueID})'s ${fixtureDataB?.fixtureLabel}`
            // );


            const checkPairGameObjectName = this.checkPairGameObjectName_(fixtureA, fixtureB);
            const checkPairFixtureLabels = this.checkPairFixtureLabels_(fixtureA, fixtureB);

            // checkPairFixtureLabels('player-hand', 'tank-body', (a: b2Fixture, b: b2Fixture) => {
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingTankEnd(a, b, contact!);
            // });

            // checkPairFixtureLabels('player-hand', 'item-body', (a: b2Fixture, b: b2Fixture) => {
            //     (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingItemEnd(a, b, contact!);
            // });


            // checkPairGameObjectName('player_bullet', 'enemy', (a: b2Fixture, b: b2Fixture) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
        }
    }

    public BeginContactFixtureParticle(system: b2ParticleSystem, contact: b2ParticleBodyContact): void {
        // do nothing
    }
    public EndContactFixtureParticle(system: b2ParticleSystem, contact: b2ParticleBodyContact): void {
        // do nothing
    }
    public BeginContactParticleParticle(system: b2ParticleSystem, contact: b2ParticleContact): void {
        // do nothing
    }
    public EndContactParticleParticle(system: b2ParticleSystem, contact: b2ParticleContact): void {
        // do nothing
    }
    public PreSolve(contact: b2Contact<b2Shape, b2Shape>, oldManifold: b2Manifold): void {
        // do nothing
    }
    public PostSolve(contact: b2Contact<b2Shape, b2Shape>, impulse: b2ContactImpulse): void {
        // do nothing
    }

    private checkPairGameObjectName_(fixtureA: b2Fixture, fixtureB: b2Fixture) {
        const gameObjectA = fixtureA?.GetBody()?.GetUserData()?.gameObject;
        const gameObjectB = fixtureB?.GetBody()?.GetUserData()?.gameObject;

        return (
            nameA: string, nameB: string,
            matchFoundCallback: (a: b2Fixture, b: b2Fixture) => void
        ) => {
            if (gameObjectA?.name === nameA && gameObjectB?.name === nameB) {
                matchFoundCallback(fixtureA, fixtureB);
            } else if (gameObjectB?.name === nameA && gameObjectA?.name === nameB) {
                matchFoundCallback(fixtureB, fixtureA);
            }
        }
    }

    private checkPairFixtureLabels_(fixtureA: b2Fixture, fixtureB: b2Fixture) {
        const fixtureDataA: IFixtureUserData = fixtureA.GetUserData();
        const fixtureDataB: IFixtureUserData = fixtureB.GetUserData();

        return (
            nameA: string, nameB: string,
            matchFoundCallback: (a: b2Fixture, b: b2Fixture) => void
        ) => {
            if (fixtureDataA?.fixtureLabel === nameA && fixtureDataB?.fixtureLabel === nameB) {
                matchFoundCallback(fixtureA, fixtureB);
            } else if (fixtureDataB?.fixtureLabel === nameA && fixtureDataA?.fixtureLabel === nameB) {
                matchFoundCallback(fixtureB, fixtureA);
            }
        }
    }

    setGameOver(winner: Team) {
        if (this.isGameOver) return;
        const isBlue = winner === Team.BLUE;
        if (isBlue) {
            this.redAi.forEach(ai => ai.destroy());
            this.redAi.length = 0;
        } else {
            this.blueAi.forEach(ai => ai.destroy());
            this.blueAi.length = 0;
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
        box
            .init(x, y, upgrades)
            .setUpgrades(upgrades)
            .initDeathTimer();

        box.initPhysics(() => {
            if (isScatter) {
                const dir = Phaser.Math.RandomXY(new Vector2(1, 1), 4);
                dir.scale(0.02 * 3 * PIXEL_TO_METER);
                box.b2Body.SetLinearVelocity(dir);
            }
        });

        this.addToList(box, this.items);
        return box;
    }

    addToList(gameObject: (GameObjects.Container & { uniqueID: number }), list: (GameObjects.Container & { uniqueID: number })[]) {
        list.push(gameObject);
        this.instancesByID[gameObject.uniqueID] = gameObject;
        gameObject.on('destroy', () => {
            list.splice(list.indexOf(gameObject), 1);
            delete this.instancesByID[gameObject.uniqueID];
            this.distanceMatrix.removeTransform(gameObject);
        });
    }

    updatePlayers() {
        const updatePlayer = (player: Player, controlsList: Controls) => {
            let xx = 0;
            let yy = 0;

            player.debugText.setText(`${player.x.toFixed(2)}, ${player.y.toFixed(2)}`);

            if (controlsList.up.isDown) { yy -= PLAYER_MOVE_SPEED; }
            if (controlsList.down.isDown) { yy += PLAYER_MOVE_SPEED; }
            if (controlsList.left.isDown) { xx -= PLAYER_MOVE_SPEED; }
            if (controlsList.right.isDown) { xx += PLAYER_MOVE_SPEED; }

            const quarterWidth = (WORLD_WIDTH - 2 * BASE_LINE_WIDTH) / 4;

            if (player.team === Team.BLUE) {
                if (player.x > WORLD_WIDTH - BASE_LINE_WIDTH - quarterWidth) {
                    player.x = WORLD_WIDTH - BASE_LINE_WIDTH - quarterWidth;
                }
            } else {
                if (player.x < BASE_LINE_WIDTH + quarterWidth) {
                    player.x = BASE_LINE_WIDTH + quarterWidth;
                }
            }

            player.doCollision();
            player.tank?.repair();
            player.moveInDirection(xx, yy);
            player.updateAim();
            if (player.hp <= 0) {
                this.setGameOver(player.team === Team.BLUE ? Team.RED : Team.BLUE);
            }
        };

        updatePlayer(this.bluePlayer, this.controlsList[0]);
        updatePlayer(this.redPlayer, this.controlsList[1]);
    }

    updateAi() {

        const updateTank = (tank: Tank) => {
            // AI decision logic

            let closestTankID = -1;
            let closestTankDistance = Infinity;
            let closestTank: Tank | Player | null = null;
            let closestItemID = -1;
            let closestItemDistance = Infinity;
            let closestItem: Item | null = null;

            this.distanceMatrix.distanceMatrix[tank.uniqueID].forEach((distance, entityID) => {
                if (entityID === tank.uniqueID) { return; }
                const entity = this.instancesByID[entityID];
                if (entity == null) { return; }

                const name = entity.name;
                switch (name) {
                    case 'tank':
                    case 'player':
                        {
                            if ((entity as (Tank | Player)).team === tank.team) { return; }
                            if (closestTankDistance > distance) {
                                closestTankID = entityID;
                                closestTankDistance = distance;
                            }
                        }
                        break;
                    case 'item':
                        {
                            if (tank.team === Team.BLUE && entity.x < tank.x) { return; }
                            if (tank.team === Team.RED && entity.x > tank.x) { return; }
                            if (closestItemDistance > distance) {
                                closestItemID = entityID;
                                closestItemDistance = distance;
                            }
                        }
                        break;
                }
            });
            if (closestTankID !== -1) {
                closestTank = this.instancesByID[closestTankID] as (Tank | Player);
                // this.physicsDebugLayer?.lineStyle(1, 0xFF0000, 0.5);
                // this.physicsDebugLayer?.lineBetween(tank.x, tank.y, closestTank.x, closestTank.y);
            }
            if (closestItemID !== -1) {
                closestItem = this.instancesByID[closestItemID] as Item;
                // this.physicsDebugLayer?.lineStyle(1, 0x00FF00, 0.5);
                // this.physicsDebugLayer?.lineBetween(tank.x, tank.y, closestItem.x, closestItem.y);
            }

            if (closestTank !== null && closestTankDistance <= tank.attr.range) {
                // stop and attack
                this.fireBullet(tank, closestTank!, closestTankDistance);
                // tank.b2Body.SetLinearVelocity({
                //     x: 0 * PIXEL_TO_METER,
                //     y: tank.b2Body.GetLinearVelocity().y,
                // });
            } else if (closestItem !== null && closestItemDistance <= TANK_CHASE_ITEM_RANGE) {
                const targetVelocity = new Vector2(
                    closestItem.x - tank.x,
                    closestItem.y - tank.y
                );
                const targetAngle = targetVelocity.angle();
                const originalAngle = tank.b2Body.GetAngle();
                const stepAngle = lerpRadians(originalAngle, targetAngle, 0.07);
                const velocity = new Vector2(
                    Math.cos(stepAngle),
                    Math.sin(stepAngle)
                );
                velocity.normalize().scale(TANK_SPEED * tank.attr.movementSpeed * PIXEL_TO_METER);
                tank.b2Body.SetLinearVelocity(velocity);
                const rot = Math.atan2(velocity.y, velocity.x);
                tank.hpBar.setRotation(-rot);
                tank.uiContainer.setRotation(-rot);
                tank.setRotation(rot);
            } else {
                const direction = tank.team === Team.BLUE ? TANK_SPEED : -TANK_SPEED;
                const targetVelocity = new Vector2(
                    direction,
                    0
                );
                const targetAngle = targetVelocity.angle();
                const originalAngle = tank.b2Body.GetAngle();
                const stepAngle = lerpRadians(originalAngle, targetAngle, 0.07);
                const velocity = new Vector2(
                    Math.cos(stepAngle),
                    Math.sin(stepAngle)
                );
                velocity.normalize().scale(TANK_SPEED * tank.attr.movementSpeed * PIXEL_TO_METER);
                tank.b2Body.SetLinearVelocity(velocity);
                const rot = Math.atan2(velocity.y, velocity.x);
                tank.hpBar.setRotation(-rot);
                tank.uiContainer.setRotation(-rot);
                tank.setRotation(rot);
            }

            tank.takeAutoBatteryDamage(this.time.now);
            if (tank.upgrades.partsList.battery <= 0) {
                this.removeTank(tank);
            }
        }

        this.blueAi.forEach((ai) => updateTank(ai));
        this.redAi.forEach((ai) => updateTank(ai));


        const detectGameOver = (tank: Tank) => {
            const isBlue = tank.team === Team.BLUE;
            if (tank.hp <= 0) return false;
            if (isBlue) {
                return tank.x > (WORLD_WIDTH - BASE_LINE_WIDTH);
            } else {
                return tank.x < BASE_LINE_WIDTH;
            }
        }
        this.blueAi.forEach((ai) => {
            if (detectGameOver(ai)) {
                this.setGameOver(ai.team);
            }
        });
        this.redAi.forEach((ai) => {
            if (detectGameOver(ai)) {
                this.setGameOver(ai.team);
            }
        });
    }

    fireBullet(tank: Tank, target: Tank | Player, distance: number) {
        if (!tank.canFire()) return;
        if (!target) return;
        const tempMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        const tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix();

        tank.barrelSprite.getWorldTransformMatrix(tempMatrix, tempParentMatrix);
        const d: any = tempMatrix.decomposeMatrix();

        const xDiff = target.x - d.translateX;
        const yDiff = target.y - d.translateY;

        const targetDir = new Vector2(xDiff, yDiff);
        const targetAngle = targetDir.angle();
        let originalTankAngle = tank.rotation;
        while (originalTankAngle < 0) { originalTankAngle += 2 * Math.PI; }

        if (Math.abs(targetAngle - originalTankAngle) > 0.03) {
            const stepAngle = lerpRadians(originalTankAngle, targetAngle, 0.03);
            tank.setRotation(stepAngle);
            tank.hpBar.setRotation(-stepAngle);
            tank.uiContainer.setRotation(-stepAngle);
        }

        let originalAngle = tank.barrelSprite.rotation + tank.rotation + Math.PI / 2;
        while (originalAngle < 0) { originalAngle += 2 * Math.PI; }
        if (Math.abs(targetAngle - originalAngle) > 0.04) {
            const stepAngle = lerpRadians(originalAngle, targetAngle, 0.04);
            tank.barrelSprite.setRotation(stepAngle - Math.PI / 2 - tank.rotation);
        } else {
            tank.setFiring(targetDir);

            const bullet = <Bullet>this.add.existing(new Bullet(this, tank.team));
            bullet.init(d.translateX, d.translateY, tank.getDamage(), tank.getRange());
            this.sfx_shoot.play();

            this.addToList(bullet, this.bullets);

            targetDir.scale(1 / distance * BULLET_SPEED);
            bullet.initPhysics(() => {
                bullet.b2Body.SetLinearVelocity({
                    x: targetDir.x * PIXEL_TO_METER,
                    y: targetDir.y * PIXEL_TO_METER,
                });
                bullet.b2Body.SetAwake(true);
            });
        }
    }

    makeUpgradeGraphics(container: Phaser.GameObjects.Container, upgrades: UpgradeObject) {
        const parts = Object.entries(upgrades.partsList) as [ItemType, number][];
        const filteredParts = (parts
            .filter(([itemType, count]: [ItemType, number]) => {
                const renderedCount = itemType === 'battery' ?
                    Math.round(count / config.items.battery.chargeFull * 10) / 10
                    : count;

                return (renderedCount > 0);
            })
        );
        // log(JSON.stringify(parts));
        log(filteredParts.length);

        const iconCount = parts.reduce((sum, [itemType, count]) => {
            return sum + (itemType === 'battery' ? Math.ceil(count / 100) : count);
        }, 0);

        const itemIconFrame: { [x: string]: string } = {
            scrap: 'I-Beam',
            barrel: 'Barrel',
            armor: 'Iron_Plating',
        };
        const itemIconTint: { [x: string]: number } = {
            battery: 0x88ff88,
            scrap: 0xffffff,
            barrel: 0xff8888,
            armor: 0x8888ff,
        };
        const batteryIconFrames: { [x: string]: string } = {
            batteryFull: 'Battery_Full',
            batteryHalf: 'Battery_Half',
            batteryLow: 'Battery_Low',
        };

        container.removeAll(true);

        // FIXME: Use object pool instead when performance is too slow
        let iconGroup: GameObjects.Container | null = container.first as GameObjects.Container | null;
        let icon: GameObjects.Image | null;
        let label: GameObjects.Text | null;

        const iconSize = 24 / Math.sqrt(filteredParts.length);
        const startY = (filteredParts.length - 1) / 2 * iconSize;
        filteredParts.forEach(([itemType, count]: [ItemType, number], i: number) => {
            const renderedCount = itemType === 'battery' ?
                Math.round(count / config.items.battery.chargeFull * 10) / 10
                : count;

            if (!iconGroup) { iconGroup = container.next as GameObjects.Container | null; }

            if (!iconGroup) {
                container.add(
                    iconGroup = this.make.container({
                        x: 0, y: 0,
                    })
                );
                container.bringToTop(iconGroup);

                iconGroup.add([
                    icon = this.make.image({
                        x: 0, y: 0,
                        key: `items_icon`,
                        frame: 'Gear',
                    }, false),
                    label = this.make.text({
                        x: 0, y: 0,
                        text: '',
                        style: {
                            align: 'left',
                            color: '#000000',
                            fontSize: 24,
                            fontWeight: 800,
                            fontFamily: 'Arial',
                        },
                    }, false),
                ]);
            }

            iconGroup.setY(startY - i * iconSize);

            icon = iconGroup.getAt(0) as GameObjects.Image;
            icon.setOrigin(0.5);
            icon.setScale(1.5 / Math.sqrt(filteredParts.length));

            label = iconGroup.getAt(1) as GameObjects.Text;
            label.setFontSize(iconSize);

            if (itemType !== ItemType.BATTERY) {
                icon.setFrame(itemIconFrame[itemType as string]);
                label.setText(renderedCount > 1 ? `x${renderedCount}` : '');
            }

            icon.setTint(itemIconTint[itemType]);

            if (itemType === ItemType.BATTERY) {
                const isFullBattery = renderedCount > 1;
                if (isFullBattery) {
                    icon.setFrame(batteryIconFrames.batteryFull);
                    label.setText(renderedCount > 1 ? `x${renderedCount}` : '');
                } else {
                    label.setText(`${renderedCount * 100}%`);
                    const charge = count;
                    if (charge > config.items.battery.chargeHalf) {
                        icon.setFrame(batteryIconFrames.batteryFull);
                    } else if (charge > config.items.battery.chargeLow) {
                        icon.setFrame(batteryIconFrames.batteryHalf);
                    } else {
                        icon.setFrame(batteryIconFrames.batteryLow);
                    }
                }
            }

            iconGroup = null;
        });

        // return (Object.entries(upgrades.partsList)
        // 	.filter(([key, value]) => value !== 0)
        // 	.map(([key, value]) => `${capitalize(key)}${(value >= 0 ? ' x' + value : value)}`)
        // 	.join('\n')
        // );
    }

    getPhysicsSystem() {
        return (this.registry.get('physicsSystem') as PhysicsSystem);
    }
}
