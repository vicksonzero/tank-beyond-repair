
import "phaser";
import { Cell } from "../../model/Board";

const board = require('json-loader!yaml-loader!../../model/basicBoard.yml') as { name: string, radius: number, boardWidth: number, cells: Cell[] };

export class MainScene extends Phaser.Scene {

    boardContainer: Phaser.GameObjects.Container;

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
        const cellRadius = board.radius;
        const cellMarginRadius = cellRadius + 10;

        const playerCount = 4;
        const playerAngle = Math.PI / playerCount;
        const boardHeight = boardWidth / 2 / Math.tan(playerAngle / 2) + cellMarginRadius / cellRadius * cellMarginRadius;
        // const boardRadius = boardWidth / 2 / Math.sin(playerAngle / 2);


        const boards = [0, 1, 2, 3].map(i => {
            const boardContainer = this.add.container(300, 300);


            const graphicOptions: Phaser.Types.GameObjects.Graphics.Options = {
                x: 0,
                y: 0,
                lineStyle: { width: 1, color: 0xFF0000, alpha: 1 },
                fillStyle: { color: 0xFF0000, alpha: 1 },
            };
            const cellGraphics = this.make.graphics(graphicOptions, false);
            cellGraphics.fillCircle(0, 0, 3);
            boardContainer.add(cellGraphics);



            board.cells.forEach((cell) => {
                const {
                    type,
                    id,
                    nextID,
                    x,
                    y,
                } = cell;

                let colorChoices: { [x: string]: number } = {
                    'cell': 0xFFFFFF,
                    'prepCell': 0xFFAAAA,
                    'stretchCell': 0xFF0000,
                    'cutCell': 0x00FF00,
                };

                const graphicOptions: Phaser.Types.GameObjects.Graphics.Options = {
                    x: (x / cellRadius * cellMarginRadius * 2) - ((boardWidth / cellRadius * cellMarginRadius * 2) / 2),
                    y: (y / cellRadius * cellMarginRadius * 2) - cellMarginRadius - boardHeight,
                    lineStyle: { width: 1, color: colorChoices[type], alpha: 1 },
                    // fillStyle: { color: 0xFFFFFF, alpha: 1 },
                };
                const cellGraphics = this.make.graphics(graphicOptions, false);
                cellGraphics.strokeCircle(0, 0, cellRadius);
                boardContainer.add(cellGraphics);

                const txtOptions = {
                    x: (x / cellRadius * cellMarginRadius * 2) - ((boardWidth / cellRadius * cellMarginRadius * 2) / 2),
                    y: (y / cellRadius * cellMarginRadius * 2) - cellMarginRadius - boardHeight,
                    text: `${id}`,
                    style: { color: '#FFFFFF', align: 'center' },
                };
                const cellText = this.make.text(txtOptions, false);
                cellText.setOrigin(0.5);
                boardContainer.add(cellText);
            });

            boardContainer.setAngle(360 / playerCount * i);
        });

    }
}
