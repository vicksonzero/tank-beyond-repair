
import * as Debug from 'debug';
import "phaser";
import { Cell } from "../../model/Board";


const log = Debug('ludo-plus:MainScene:log');
// const warn = Debug('ludo-plus:MainScene:warn');
// warn.log = console.warn.bind(console);

const board = require('json-loader!yaml-loader!../../model/basicBoard.yml') as { name: string, radius: number, boardWidth: number, cells: Cell[] };

export class MainScene extends Phaser.Scene {

    boardContainer: Phaser.GameObjects.Container;

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
        const cellRadius = 20;
        const cellMargin = 10;
        const cellMarginRadius = cellRadius + cellMargin;
        const cellEndMarginRadius = cellRadius + cellMargin / 2;

        const playerCount = 5;
        const playerAngle = 2 * Math.PI / playerCount;
        const ww = (boardWidth / definitionRadius * cellMarginRadius + cellEndMarginRadius * 2);
        const boardHeight = (ww / 2) / Math.tan(playerAngle / 2);
        // const boardRadius = boardWidth / 2 / Math.sin(playerAngle / 2);;


        let lastUsedId = 0;
        const boards = Array(playerCount).fill(1).map((_, i) => {
            const boardContainer = this.add.container(this.mainCamera.width / 2, this.mainCamera.height / 2);
            boardContainer.setAngle(360 / playerCount * i);

            const graphicOptions: Phaser.Types.GameObjects.Graphics.Options = {
                x: 0,
                y: 0,
                lineStyle: { width: 1, color: 0xFF0000, alpha: 1 },
                fillStyle: { color: 0xFF0000, alpha: 1 },
            };
            const cellGraphics = this.make.graphics(graphicOptions, false);
            cellGraphics.fillCircle(0, 0, 3);
            boardContainer.add(cellGraphics);

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

                let colorChoices: { [x: string]: number } = {
                    'cell': 0xFFFFFF,
                    'takeOffCell': 0xAAAAFF,
                    'stretchCell': 0xFF0000,
                    'stretchEntranceCell': 0xFFAAAA,
                    'cutCell': 0x00FF00,
                };

                const graphicOptions: Phaser.Types.GameObjects.Graphics.Options = {
                    x: (x / definitionRadius * cellMarginRadius) - (boardWidth / definitionRadius * cellMarginRadius) / 2,
                    y: (y / definitionRadius * cellMarginRadius) - cellMarginRadius - boardHeight,
                    lineStyle: { width: 1, color: colorChoices[type], alpha: 1 },
                    // fillStyle: { color: 0xFFFFFF, alpha: 1 },
                };
                const cellGraphics = this.make.graphics(graphicOptions, false);;
                cellGraphics.strokeCircle(0, 0, cellRadius);
                boardContainer.add(cellGraphics);

                const txtOptions = {
                    x: (x / definitionRadius * cellMarginRadius) - (boardWidth / definitionRadius * cellMarginRadius) / 2,
                    y: (y / definitionRadius * cellMarginRadius) - cellMarginRadius - boardHeight,
                    text: `${lastUsedId + id}`,
                    style: { color: '#FFFFFF', align: 'center' },
                };
                const cellText = this.make.text(txtOptions, false);
                cellText.setOrigin(0.5);
                cellText.setAngle(-boardContainer.angle);
                boardContainer.add(cellText);
            });

            lastUsedId += cells[cells.length - 1].id + 1;
            log(`lastUsedId ${lastUsedId}`);
            return boardContainer;
        });

        log(boards);;

    }
}
