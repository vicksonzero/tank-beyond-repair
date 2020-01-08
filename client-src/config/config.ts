import { Immutable } from "../utils/ImmutableType";


export type IConfig = Immutable<{
    viewWidth: integer,
    viewHeight: integer,
    viewLeft: integer,
    viewTop: integer,
    movementTweenSpeed: number,
    controls: IUIControls;
    credits: ICreditEntry[];
}>

export interface IUIControls {
    swipeThumbSize: number,
    minSwipeDist: number,
    directionSnaps: integer,
}

export interface ICreditEntry {
    title: string;
    names: string[]
}

const c = require('json-loader!yaml-loader!./config.yml');

export const config = c.config as IConfig;