
const { default: txt } = require('../config/saveFile.txt');


export type PositionHistoryPosItem = { frameID: number, type: 'create' | 'destroy' | 'pos', list: (number | string)[][] };
export type PositionHistoryVectorItem = { frameID: (number | string), type: 'create-item', list: number[][] };
export type PositionHistoryItems = PositionHistoryPosItem | PositionHistoryVectorItem;


export class ReplayManager {

    replayStr: string = txt;
    isReplay = false;
}