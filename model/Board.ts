export class Board {

}

export class Cell {
    public type: string = 'cell';
    public id: integer;
    public nextID: integer | 'next';

    public x: number;
    public y: number;
}

export class PrepCell extends Cell {
    public type: string = 'prepCell';

    public prevID: integer;

    public isGoal: boolean;
}

export class StretchEntranceCell extends Cell {
    public type: string = 'stretchEntranceCell';

    public nextStretchID: integer;
}

export class StretchCell extends Cell {
    public type: string = 'stretchCell';

    public prevID: integer;

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