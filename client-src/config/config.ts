import * as yaml from 'js-yaml';
import { Immutable } from "../utils/ImmutableType";

const txt: any = require('./conf.yml');


export type IConfig = Immutable<{
    controls: IUIControls;
    itemSpawnChance: IItemSpawnChance;
    items: {
        battery: {
            chargeFull: number;
            chargeHalf: number;
            chargeLow: number;
        }
    }
    partRequirements: Partial<IPartRequirements>;
    parts: Partial<IPartEffectMap>;
    credits: ICreditEntry[];
}>



export enum PartType {
    CHASSIS = 'chassis',
    CANNON = 'cannon',
    ARMOR = 'armor',
    GUN = 'gun',
    MISSILE = 'missile',
    ROCKET = 'rocket',
};

export type IPartList = {
    [x in PartType]: number;
}

export enum ItemType {
    SCRAP = 'scrap',
    BARREL = 'barrel',
    ARMOR = 'armor',
    BATTERY = 'battery',
};

export type ItemsList = {
    [x in ItemType]: number;
};

export type AttributeType = 'range' | 'damage' | 'attackInterval' | 'aimSpeed' | 'maxHP' | 'movementSpeed' | 'turnSpeed' | 'maxBattery' | 'dmgMultiplier';

export type IAttributeMap = {
    [x in AttributeType]: number;
}



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
