export class Room {
    public lastUsed: number;
    public game: any;
    public eventStore: any;

    constructor(params: RoomConstructParams) {
        this.lastUsed = params.lastUsed;
    }

    buildGame() {
        // this.game
        // this.eventStore
    }
}

export interface RoomConstructParams {
    lastUsed: number
}
