import { Immutable } from "../client-src/utils/ImmutableType";

export class Board {

}

export interface IBoardDef {
    name: string;
    radius: number;
    boardWidth: number;
    cells: Cell[];
    stretchCells: StretchCell[];
}

export class Cell {
    public type: string = 'cell';
    public id: integer;
    public nextID: integer | 'next';

    public x: number;
    public y: number;
}

export class TakeOffCell extends Cell {
    public type: string = 'takeOffCell';
}

export class StretchEntranceCell extends Cell {
    public type: string = 'stretchEntranceCell';

    public nextStretchID: integer;
}

export class StretchCell extends Cell {
    public type: string = 'stretchCell';

    public nextID: integer | null;
    public prevID: integer | 'prev';

    public isGoal: boolean;
}

/**
 * @desc
 * jumps long distance into `cutDestID`, killing any planes inside `cutsID`
 */
export class CutCell extends Cell {
    public type: string = 'cutCell';

    public cutsID: integer;
    public cutDestID: integer;
}