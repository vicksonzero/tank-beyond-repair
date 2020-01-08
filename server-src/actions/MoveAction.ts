export interface MoveAction {
    subject: any;
    verb: 'move';
    movePieceID: number;
}