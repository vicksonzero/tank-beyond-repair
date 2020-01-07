import { Room } from "./Room";

export class RoomManager {
    private rooms: Map<string, Room> = new Map<string, Room>();
    private idleRoomLimit = 1 * 60 * 1000; // 1min

    constructor() {

    }

    getNewRoom() {
        const newRoom = new Room({
            lastUsed: Date.now(),
        });

        return newRoom;
    }
}

