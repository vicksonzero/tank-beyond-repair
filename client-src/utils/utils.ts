import { UpgradeObject } from "../entities/Upgrade";

export function capitalize(str: string) {
    return '' + str.charAt(0).toUpperCase() + str.substring(1);
}

export type IMatterContactPoints = { vertex: { x: number; y: number; }; }[];

export function makeUpgradeString(upgrades: UpgradeObject) {
    return (Object.entries(upgrades.partsList)
        .filter(([key, value]) => value !== 0)
        .map(([key, value]) => `${capitalize(key)}${(value >= 0 ? ' x' + value : value)}`)
        .join('\n')
    );
}

function lerp(a: number, b: number, lerpFactor: number): number {
    const result: number = ((1 - lerpFactor) * a) + (lerpFactor * b);
    return result;
}

export function lerpRadians(a: number, b: number, lerpFactor: number): number// Lerps from angle a to b (both between 0.f and 2*Math.PI), taking the shortest path
{
    let result: number;
    let diff: number = b - a;
    if (diff < -Math.PI) {
        // lerp upwards past 2*Math.PI
        b += 2 * Math.PI;
        result = lerp(a, b, lerpFactor);
        if (result >= 2 * Math.PI) {
            result -= 2 * Math.PI;
        }
    }
    else if (diff > Math.PI) {
        // lerp downwards past 0
        b -= 2 * Math.PI;
        result = lerp(a, b, lerpFactor);
        if (result < 0) {
            result += 2 * Math.PI;
        }
    }
    else {
        // straight lerp
        result = lerp(a, b, lerpFactor);
    }

    return result;
}