// import * as BSON from 'bson';
// import { fromUint8Array, toUint8Array } from 'js-base64';

export type InputAction = {
    type: 'input';
    isSync: true;
    who: number;
    key: 'up' | 'down' | 'left' | 'right' | 'action';
    value: 'up' | 'down';
}

export type CheatInputAction = {
    type: 'cheat-input';
    isSync: true;
    key: 'cheatSpawnUpgrades';
}

export type RNGAction = {
    type: 'rng';
    isSync: true;
    value: string;
}

export type IAction = InputAction | RNGAction | CheatInputAction;

export type Event = IAction | {
    frameID: number,
};

export class EventQueue {
    queue: Map<number, IAction[]>;

    constructor() {
        this.queue = new Map();
    }

    addActionAt(frameID: number, action: IAction) {
        const bucket = this.queue.get(frameID) ?? [];
        bucket.push(action);
        this.queue.set(frameID, bucket);
    }

    getEventsOfFrame(frameID: number, type?: IAction['type']): IAction[] {
        const events = this.queue.get(frameID) ?? [];
        if (type != null) {
            return events.filter(e => e.type === type);
        }
        return events;
    }

    loadFromDataStr(json: { [x: number]: IAction[] } | string) {
        if (typeof json === "string") {
            json = JSON.parse(json) as { [x: number]: IAction[] };
        }

        return this.loadFromData(json);
    }

    loadFromData(json: any) {
        this.queue = new Map(json);
    }

    applyDelta(data: { [x: number]: IAction[] }) {
        Object.entries(data)
            .forEach(([frameIDStr, actions]) => {
                this.queue.set(Number(frameIDStr), actions);
            });
    }

    toJSON(): string {
        return JSON.stringify([...this.queue]);
    }

    // loadFromBSON(bsonString: string): this {
    //     const res = this.fromBSON(bsonString);
    //     // console.log(res);
    //     this.queue = new Map(res);

    //     return this;
    // }

    // fromBSON(bsonString: string) {
    //     const res = Array.from(Object.values(BSON.deserialize(toUint8Array(bsonString))));
    //     return res;
    // }

    // toBSON() {
    //     return fromUint8Array(BSON.serialize([...this.queue]), true);
    // }
}

