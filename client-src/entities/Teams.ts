import { Team } from "./Team";

export const Teams = {
    [Team.BLUE]: {
        facing: 0,
        normalTint: 0x6666ff,
        highlightTint: 0x8888ff,
        hitTint: 0xFF0000,
        damagedTint: 0x3333aa,
    },
    [Team.RED]: {
        facing: Math.PI,
        normalTint: 0xff5555,
        highlightTint: 0xff7777,
        hitTint: 0xFF0000,
        damagedTint: 0xaa3333,
    },
};