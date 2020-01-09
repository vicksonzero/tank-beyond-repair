
import * as Debug from 'debug';
import "phaser";
import { Cell, IBoardDef } from "../../model/Board";
import { Immutable } from '../utils/ImmutableType';

type Key = Phaser.Input.Keyboard.Key;

const log = Debug('ludo-plus:MainScene:log');
// const warn = Debug('ludo-plus:MainScene:warn');
// warn.log = console.warn.bind(console);

const board = require('json-loader!yaml-loader!../../model/basicBoard.yml') as Immutable<IBoardDef>;

const colorChoices: { [x: string]: number } = {
    'cell': 0x888888,
    'takeOffCell': 0x88DD88,
    'stretchCell': 0xDD0000,
    'stretchEntranceCell': 0xDD8888,
    'cutCell': 0x00DD00,
};

export class MainScene extends Phaser.Scene {

    boardContainer: Phaser.GameObjects.Container;

    arrowKeys: { up: Key, down: Key, left: Key, right: Key };
    scrollSpeed = 10;

    get mainCamera() { return this.sys.cameras.main; }

    constructor() {
        super({
            key: "MainScene",
        })
    }

    preload() {
        // _preload.call(this);
    }

    create(): void {
        const boardWidth = board.boardWidth;
        const definitionRadius = board.radius;
        const cellRadius = 30;
        const cellMargin = 10;
        const cellMarginRadius = cellRadius + cellMargin;
        const cellEndMarginRadius = cellRadius + cellMargin / 2;

        const playerCount = 3;
        const playerAngle = 2 * Math.PI / playerCount;
        const ww = (boardWidth / definitionRadius * cellMarginRadius + cellEndMarginRadius * 2);
        const boardHeight = (ww / 2) / Math.tan(playerAngle / 2);
        // const boardRadius = boardWidth / 2 / Math.sin(playerAngle / 2);
        this.boardContainer = this.add.container(this.mainCamera.width / 2, this.mainCamera.height / 2);

        let lastUsedId = 0;
        const boards = Array(playerCount).fill(1).map((_, i) => {
            const boardPieceContainer = this.add.container(0, 0);
            boardPieceContainer.setAngle(360 / playerCount * i);

            const graphicOptions: Phaser.Types.GameObjects.Graphics.Options = {
                x: 0,
                y: 0,
                lineStyle: { width: 1, color: 0xFF0000, alpha: 1 },
                fillStyle: { color: 0xEEEEEE, alpha: 1 },
            };
            const cellGraphics = this.make.graphics(graphicOptions, false);
            cellGraphics.fillCircle(0, 0, 3);
            boardPieceContainer.add(cellGraphics);

            // const lineGraphicOptions: Phaser.Types.GameObjects.Graphics.Options = {
            //     x: 0,
            //     y: 0,
            //     lineStyle: { width: 1, color: 0x00DD00, alpha: 1 },
            //     fillStyle: { color: 0x00DD00, alpha: 1 },
            // };
            // const lineGraphics = this.make.graphics(lineGraphicOptions, false);
            // cellGraphics.moveTo(0, 0);
            // cellGraphics.lineTo(0, -boardHeight);
            // cellGraphics.moveTo(-ww / 2, -boardHeight);
            // cellGraphics.lineTo(ww / 2, -boardHeight);
            // cellGraphics.strokePath();
            // boardContainer.add(lineGraphics);

            const cells = board.cells.slice();

            cells.sort((a, b) => a.id - b.id);
            cells.forEach((cell) => {
                const {
                    type,
                    id,
                    nextID,
                    x,
                    y,
                } = cell;

                const graphicOptions: Phaser.Types.GameObjects.Graphics.Options = {
                    x: (x / definitionRadius * cellMarginRadius) - (boardWidth / definitionRadius * cellMarginRadius) / 2,
                    y: (y / definitionRadius * cellMarginRadius) - cellMarginRadius - boardHeight,
                    lineStyle: { width: 2, color: colorChoices[type], alpha: 1 },
                    // fillStyle: { color: 0xFFFFFF, alpha: 1 },
                };
                const cellGraphics = this.make.graphics(graphicOptions, false);
                cellGraphics.fillCircle(0, 0, cellRadius);
                cellGraphics.strokeCircle(0, 0, cellRadius);
                boardPieceContainer.add(cellGraphics);

                const txtOptions = {
                    x: (x / definitionRadius * cellMarginRadius) - (boardWidth / definitionRadius * cellMarginRadius) / 2,
                    y: (y / definitionRadius * cellMarginRadius) - cellMarginRadius - boardHeight,
                    text: `${lastUsedId + id}`,
                    style: { color: '#000000', align: 'center', fontSize: 24 },
                };
                const cellText = this.make.text(txtOptions, false);
                cellText.setOrigin(0.5);
                cellText.setAngle(-boardPieceContainer.angle);
                boardPieceContainer.add(cellText);
            });
            const stretchCells = board.stretchCells.slice(0, playerCount + 2);

            stretchCells.sort((a, b) => a.id - b.id);
            stretchCells.forEach((stretchCell, i) => {
                const {
                    type,
                    id,
                    nextID,
                    isGoal,
                    prevID,
                    x,
                    y,
                } = stretchCell;

                const graphicOptions: Phaser.Types.GameObjects.Graphics.Options = {
                    x: (x / definitionRadius * cellMarginRadius) - (boardWidth / definitionRadius * cellMarginRadius) / 2,
                    y: (y / definitionRadius * cellMarginRadius) - cellMarginRadius - boardHeight,
                    lineStyle: { width: 2, color: colorChoices[type], alpha: 1 },
                    fillStyle: { color: 0xEEEEEE, alpha: 1 },
                };
                const cellGraphics = this.make.graphics(graphicOptions, false);
                cellGraphics.fillCircle(0, 0, cellRadius);
                cellGraphics.strokeCircle(0, 0, cellRadius);
                boardPieceContainer.add(cellGraphics);

                if (i === stretchCells.length - 1) {
                    const graphicOptionsGoal: Phaser.Types.GameObjects.Graphics.Options = {
                        x: (x / definitionRadius * cellMarginRadius) - (boardWidth / definitionRadius * cellMarginRadius) / 2,
                        y: (y / definitionRadius * cellMarginRadius) - cellMarginRadius - boardHeight,
                        lineStyle: { width: 2, color: colorChoices[type], alpha: 1 },
                        // fillStyle: { color: 0xFFFFFF, alpha: 1 },
                    };
                    const cellGraphicsGoal = this.make.graphics(graphicOptionsGoal, false);
                    cellGraphics.strokeCircle(0, 0, cellRadius + 8);
                    boardPieceContainer.add(cellGraphicsGoal);
                }

                const txtOptions = {
                    x: (x / definitionRadius * cellMarginRadius) - (boardWidth / definitionRadius * cellMarginRadius) / 2,
                    y: (y / definitionRadius * cellMarginRadius) - cellMarginRadius - boardHeight,
                    text: `S${id}`,
                    style: { color: '#000000', align: 'center', fontSize: 24 },
                };
                const cellText = this.make.text(txtOptions, false);
                cellText.setOrigin(0.5);
                cellText.setAngle(-boardPieceContainer.angle);
                boardPieceContainer.add(cellText);
            });

            lastUsedId += cells[cells.length - 1].id + 1;
            log(`lastUsedId ${lastUsedId}`);
            return boardPieceContainer;
        });

        this.boardContainer.add(boards);

        log(boards);

        this.setUpKeyboard();

    }

    update(time: number, dt: number) {
        let xx = this.boardContainer.x;
        let yy = this.boardContainer.y;
        if (this.arrowKeys.up.isDown) yy += this.scrollSpeed;
        if (this.arrowKeys.down.isDown) yy -= this.scrollSpeed;
        if (this.arrowKeys.left.isDown) xx += this.scrollSpeed;
        if (this.arrowKeys.right.isDown) xx -= this.scrollSpeed;

        this.boardContainer.setPosition(xx, yy);
    }

    setUpKeyboard() {
        this.arrowKeys = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
        }

    }
}
