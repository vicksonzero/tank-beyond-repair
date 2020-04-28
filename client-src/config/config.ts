import { Immutable } from "../utils/ImmutableType";
import * as yaml from 'js-yaml';
import { ItemType, AttributeType, PartType, ItemsList, IAttributeMap, IPartList } from "../entities/Upgrade";

const txt: any = require('./conf.yml');


export type IConfig = Immutable<{
    controls: IUIControls;
    itemSpawnChance: IItemSpawnChance;
    partRequirements: Partial<IPartRequirements>;
    parts: Partial<IPartEffectMap>;
    credits: ICreditEntry[];
}>

export type IPartRequirements = {
    [x in PartType]: Array<ItemsList>;
}

export type IItemSpawnChance = {
    [x in ItemType]: number;
}

export type IPartEffectMap = {
    [x in PartType]: Array<Partial<IPartEffect>>;
};

export type IPartEffect = {
    stat: Partial<IAttributeMap>;
    graphics?: IPartGraphics;
    mountPoints?: IMountPoint;
};

export type PointArray = number[]; // x,y

export interface IMountPoint {
    type: 'cannon' | 'gun' | 'rocket';
    offset: PointArray;
}
export interface IPartGraphics {
    sprite: string;
    scale: PointArray;
}

export interface IUIControls {
    swipeThumbSize: number,
    minSwipeDist: number,
    directionSnaps: number,
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
