

export type ActionTypes = 'input';
export interface IAction {
    type: ActionTypes;
    [x: string]: any;
};

export interface InputAction extends IAction {
    type: 'input';
    who: number;
    key: 'up' | 'down' | 'left' | 'right' | 'action';
    value: 'up' | 'down';
}

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

    getEventsOfFrame(frameID: number, type?: ActionTypes): IAction[] {
        const events = this.queue.get(frameID) ?? [];
        if (type != null) {
            return events.filter(e => e.type === type);
        }
        return events;
    }

    fromDataStr(json: { [x: number]: IAction[] } | string) {
        if (typeof json === "string") {
            json = JSON.parse(json) as { [x: number]: IAction[] };
        }

        return this.fromData(json);
    }

    fromData(json: { [x: number]: IAction[] }) {
        this.queue = new Map(
            Object.entries(json)
                .map(([k, v]) => ([Number(k), v]))
        );
    }

    applyDelta(data: { [x: number]: IAction[] }) {
        Object.entries(data)
            .forEach(([frameIDStr, actions]) => {
                this.queue.set(Number(frameIDStr), actions);
            });
    }

    toJSON(): string {
        return JSON.stringify(this.queue);
    }
}

