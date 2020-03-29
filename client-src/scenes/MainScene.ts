import * as Debug from 'debug';
import "phaser";
import { preload as _preload, setUpAudio } from '../assets';
import { BASE_LINE_WIDTH, BULLET_SPEED, DEBUG_DISABLE_SPAWNING, PLAYER_MOVE_SPEED, SPAWN_DELAY, SPAWN_INTERVAL, WORLD_HEIGHT, WORLD_WIDTH, DEBUG_PHYSICS, PIXEL_TO_METER, TANK_SPEED } from '../constants';
import { Bullet } from '../entities/Bullet';
import { Item } from '../entities/Item';
// import { Immutable } from '../utils/ImmutableType';
import { Player } from '../entities/Player';
import { Tank } from '../entities/Tank';
import { Team } from '../entities/Team';
import { UpgradeObject, UpgradeType } from '../entities/Upgrade';
import { PhysicsSystem } from '../PhysicsSystem';
import { HpBar } from '../ui/HpBar';
// import { GameObjects } from 'phaser';
import { capitalize, IMatterContactPoints } from '../utils/utils';
import { b2ContactListener, b2Contact, b2Shape, b2ParticleSystem, b2ParticleBodyContact, b2ParticleContact, b2Manifold, b2ContactImpulse, b2BodyType, b2Body, b2Fixture, b2WorldManifold } from '@flyover/box2d';


type BaseSound = Phaser.Sound.BaseSound;
type Key = Phaser.Input.Keyboard.Key;
type Container = Phaser.GameObjects.Container;
type Graphics = Phaser.GameObjects.Graphics;
type Image = Phaser.GameObjects.Image;

const Vector2 = Phaser.Math.Vector2;
const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

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
        this.getPhysicsSystem().init(this as b2ContactListener);
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
        this.bluePlayer.spawnItem = this.spawnItem;
        this.bluePlayer
            .initHpBar(new HpBar(this, 0, -25, 30, 4))
            .init(100, 100);
        this.bluePlayer.initPhysics();

        this.playerLayer.add(this.redPlayer = new Player(this, Team.RED));
        this.redPlayer.spawnItem = this.spawnItem;
        this.redPlayer
            .initHpBar(new HpBar(this, 0, -25, 30, 4))
            .init(WORLD_WIDTH - 100, WORLD_HEIGHT - 100)
            .faceLeft();
        this.redPlayer.initPhysics();

        const createAi = (team: Team, x: number, y: number) => {
            let ai: Tank;
            this.tankLayer.add(ai = new Tank(this, team));
            ai
                .initHpBar(new HpBar(this, 0, -25, 30, 4))
                .init(x, y);
            ai.initPhysics();
            return ai;
        };

        this.blueAi = [];
        this.redAi = [];

        if (!DEBUG_DISABLE_SPAWNING) {
            const spawnCallback = () => {
                if (this.isGameOver) return;
                this.blueAi = this.blueAi.concat([200, 400, 600].map((y) => {
                    return createAi(Team.BLUE, 0, Phaser.Math.RND.integerInRange(y - 50, y + 50));
                }));
                this.redAi = this.redAi.concat([200, 400, 600].map((y) => {
                    return createAi(Team.RED, this.sys.game.canvas.width, Phaser.Math.RND.integerInRange(y - 50, y + 50));
                }));
            };

            this.spawnTimer = this.time.addEvent({
                startAt: SPAWN_DELAY,
                delay: SPAWN_INTERVAL,
                callback: spawnCallback,
                loop: true,
            });
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
        })

        this.bullets = [];

        this.setUpGUI();
        this.setUpKeyboard();
        log('create complete');
    }

    update(time: number, dt: number) {
        log(`update ${time}`);

        this.getPhysicsSystem().update(
            time,
            (DEBUG_PHYSICS ? this.physicsDebugLayer : null)
        );

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
            const direction = tank.team === Team.BLUE ? TANK_SPEED : -TANK_SPEED;
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
                const fireBullet = async (tank: Tank, target: Tank | Player) => {
                    if (!tank.canFire()) return;
                    const xDiff = target.x - tank.x;
                    const yDiff = target.y - tank.y;
                    tank.setFiring({ x: xDiff, y: yDiff });
                    const bullet = <Bullet>this.add.existing(new Bullet(this, tank.team));
                    bullet.init(tank.x, tank.y, tank.getDamage(), tank.getRange());
                    this.sfx_shoot.play();
                    this.bullets.push(bullet);

                    await bullet.initPhysics();
                    bullet.b2Body.SetLinearVelocity({
                        x: (xDiff / distance * BULLET_SPEED) * PIXEL_TO_METER,
                        y: (yDiff / distance * BULLET_SPEED) * PIXEL_TO_METER,
                    });
                    bullet.b2Body.SetAwake(true);
                }
                fireBullet(tank, target);
                // tank.b2Body.SetLinearVelocity({
                //     x: 0 * PIXEL_TO_METER,
                //     y: tank.b2Body.GetLinearVelocity().y,
                // });
            } else {
                tank.b2Body.SetLinearVelocity({
                    x: direction * PIXEL_TO_METER,
                    y: tank.b2Body.GetLinearVelocity().y,
                });
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
        log(`update complete`);
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
        log('removeBullet');
        this.bullets = this.bullets.filter(b => b !== bullet);
        bullet.destroy();
    }


    public BeginContact(pContact: b2Contact<b2Shape, b2Shape>): void {
        for (let contact = pContact; contact; contact = contact.GetNext()) {
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();

            const bodyDataA = fixtureA.GetBody()?.GetUserData();
            const bodyDataB = fixtureB.GetBody()?.GetUserData();
            log(`BeginContact ${bodyDataA} vs ${bodyDataB}`);


            const checkPairGameObjectName = this.checkPairGameObjectName_(fixtureA, fixtureB);
            const checkPairFixtureLabels = this.checkPairFixtureLabels_(fixtureA, fixtureB);

            checkPairFixtureLabels('hand', 'tank-body', (a: b2Fixture, b: b2Fixture) => {
                (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingTankStart(a, b, contact);
            });

            checkPairFixtureLabels('hand', 'item-body', (a: b2Fixture, b: b2Fixture) => {
                (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingItemStart(a, b, contact);
            });

            checkPairGameObjectName('tank', 'bullet', (tankFixture: b2Fixture, bulletFixture: b2Fixture) => {
                const tank: Tank = tankFixture.GetBody()?.GetUserData()?.gameObject as Tank;
                const bullet: Bullet = bulletFixture.GetBody()?.GetUserData()?.gameObject as Bullet;
                tank.takeDamage(bullet.damage);
                if (tank.hp <= 0) {
                    this.removeTank(tank);
                }
                this.removeBullet(bullet);
            });

            checkPairGameObjectName('player', 'bullet', (playerFixture: b2Fixture, bulletFixture: b2Fixture) => {
                const player: Player = playerFixture.GetBody()?.GetUserData()?.gameObject as Player;
                const bullet: Bullet = bulletFixture.GetBody()?.GetUserData()?.gameObject as Bullet;
                player.takeDamage(bullet.damage);
                player.updateHpBar();
                this.removeBullet(bullet);
            });

            // checkPairGameObjectName('player_bullet', 'enemy', (a: b2Fixture, b: b2Fixture) => {
            //     // (<PlayerBullet>a.gameObject).onHitEnemy(b.gameObject, activeContacts as IMatterContactPoints);
            // });
        }
    }
    public EndContact(pContact: b2Contact<b2Shape, b2Shape>): void {
        for (let contact = pContact; contact; contact = contact.GetNext()) {
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();

            const bodyDataA = fixtureA.GetBody()?.GetUserData();
            const bodyDataB = fixtureB.GetBody()?.GetUserData();
            log(`BeginContact ${bodyDataA} vs ${bodyDataB}`);


            const checkPairGameObjectName = this.checkPairGameObjectName_(fixtureA, fixtureB);
            const checkPairFixtureLabels = this.checkPairFixtureLabels_(fixtureA, fixtureB);

            checkPairFixtureLabels('hand', 'tank-body', (a: b2Fixture, b: b2Fixture) => {
                (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingTankEnd(a, b, contact);
            });

            checkPairFixtureLabels('hand', 'item-body', (a: b2Fixture, b: b2Fixture) => {
                (<Player>a.GetBody()?.GetUserData()?.gameObject).onTouchingItemEnd(a, b, contact);
            });


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
        const fixtureDataA = fixtureA.GetUserData();
        const fixtureDataB = fixtureB.GetUserData();

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
        box
            .init(x, y, upgrades)
            .setUpgrades(upgrades)
            .initDeathTimer();

        box.initPhysics().then(() => {
            if (isScatter) {
                const dir = Phaser.Math.RandomXY(new Vector2(1, 1), 10);
                box.b2Body.SetLinearVelocity(dir);
            }
        });
        return box;
    }

    getPhysicsSystem() {
        return (this.registry.get('physicsSystem') as PhysicsSystem);
    }
}
