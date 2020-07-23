import { GameObjects } from "phaser";

export type TransformWithUniqueID = GameObjects.Components.Transform & { uniqueID: number };

export class DistanceMatrix {

    distanceMatrix: number[][] = [];
    constructor() {

    }
    init(transformList: TransformWithUniqueID[], graphics?: Phaser.GameObjects.Graphics) {
        const distanceMatrix: number[][] = [];
        transformList.forEach((transform) => {
            distanceMatrix[transform.uniqueID] = [];
        });
        transformList.forEach((transform1) => {
            transformList.forEach((transform2) => {
                this.updateDistanceBetween(transform1, transform2, distanceMatrix);

                graphics?.lineStyle(1, 0xAAAAAA, 0.7);
                graphics?.lineBetween(transform1.x, transform1.y, transform2.x, transform2.y);
            });
        });

        this.distanceMatrix = distanceMatrix;
    }

    updateTransform(transform: TransformWithUniqueID, transformList: TransformWithUniqueID[]) {
        return this.insertTransform(transform, transformList);
    }

    insertTransform(transform: TransformWithUniqueID, transformList: TransformWithUniqueID[]) {
        const distanceMatrix = this.distanceMatrix.map((row) => [...row]);
        transformList.forEach((transform2) => {
            this.updateDistanceBetween(transform, transform2, distanceMatrix);
        });
        this.distanceMatrix = distanceMatrix;
    }

    removeTransform(transform: TransformWithUniqueID){
        delete this.distanceMatrix[transform.uniqueID];
    }

    updateDistanceBetween(transform1: TransformWithUniqueID, transform2: TransformWithUniqueID, distanceMatrix: number[][]) {
        const dx = transform1.x - transform2.x;
        const dy = transform1.y - transform2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        distanceMatrix[transform1.uniqueID][transform2.uniqueID] = distance;
        distanceMatrix[transform2.uniqueID][transform1.uniqueID] = distance;
    }

    getDistanceBetween(transform1: TransformWithUniqueID, transform2: TransformWithUniqueID) {
        return this.distanceMatrix[transform1.uniqueID][transform2.uniqueID];
    }
}