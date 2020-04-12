import { Immutable } from "../utils/ImmutableType";
import * as yaml from 'js-yaml';
import { PartType, AttributeType } from "../entities/Upgrade";

const txt: any = require('./conf.yml');


export type IConfig = Immutable<{

    controls: IUIControls;
    items: IItemEffectMap;
    itemSpawnChance: IItemSpawnChance;
    credits: ICreditEntry[];
}>

export type IItemSpawnChance = {
    [x in PartType]: number;
}

export type IItemEffectMap = {
    [x in PartType]: Array<IItemEffect>;
};

export type IItemEffect = {
    [x in AttributeType]: number;
} & {
    xp: number | 'n';
};

export interface IUIControls {
    swipeThumbSize: number,
    minSwipeDist: number,
    directionSnaps: integer,
}

export interface ICreditEntry {
    title: string;
    names: string[]
}

const c = { doc: { config: {} } };

// Get document, or throw exception on error
try {
    c.doc = yaml.safeLoad(txt.default);
} catch (e) {
    console.error(e);
}

export const config = c.doc.config as IConfig;
