import { Scene } from "phaser";

export class HpBar extends Phaser.GameObjects.Graphics {
    barWidth: number;
    barHeight: number;
    batteryBarHeight: number;

    barX: number;
    barY: number;

    maxBattery: number = 0;

    constructor(scene: Scene, x: number, y: number, barWidth: number, barHeight: number, batteryBarHeight: number) {
        super(scene, { x: 0, y: 0 });
        this.barX = x;
        this.barY = y;
        this.barWidth = barWidth;
        this.barHeight = barHeight;
        this.batteryBarHeight = batteryBarHeight;
    }


    updateHpBar(hp: number, maxHP: number, widthBonus = 0) {
        this.clear();
        const width = this.barWidth + widthBonus;
        const height = this.barHeight;

        const segmentCount = Math.ceil(maxHP / 100);
        const segmentGap = 2;
        const segmentWidth = (width - (segmentCount - 1) * segmentGap) / (maxHP / 100);

        console.log('hp, maxHP, segmentCount', hp, maxHP, segmentCount);

        const hue = (hp / maxHP * 120 / 360);
        const borderColor = Phaser.Display.Color.HSLToColor(hue, 1, 0.4).color;
        const fillColor = Phaser.Display.Color.HSLToColor(hue, 1, 0.5).color;

        this.lineStyle(1, borderColor, 1);
        this.strokeRect(-width / 2 + this.barX, -height / 2 + this.barY, width, height);

        this.fillStyle(fillColor, 1);

        for (let i = 0; i < segmentCount; i++) {
            const renderedWidth = Math.max(0, Math.min(100, hp - 100 * i)) / 100 * segmentWidth;
            this.fillRect(
                -width / 2 + this.barX + (segmentWidth + segmentGap) * i,
                -height / 2 + this.barY,
                renderedWidth,
                height
            );
        }
    }

    updateHpBatteryBar(hp: number, maxHP: number, battery: number, widthBonus = 0) {
        this.updateHpBar(hp, maxHP, widthBonus);
        if (this.maxBattery < battery) {
            this.maxBattery = battery;
        }

        const maxBatteryCharge = 100;
        const width = this.barWidth + widthBonus;
        const height = this.barHeight;

        const segmentCount = Math.ceil(this.maxBattery / maxBatteryCharge);
        const segmentGap = 2;
        const segmentWidth = (width - (segmentCount - 1) * segmentGap) / segmentCount;

        const hue = (hp / maxHP * 120 / 360);
        const color = Phaser.Display.Color.HSLToColor(hue, 1, 0.3).color;

        this.fillStyle(color, 1);

        for (let i = 0; i < segmentCount; i++) {
            const renderedWidth = (i < segmentCount - 1) ? segmentWidth
                : (battery - maxBatteryCharge * (segmentCount - 1)) / maxBatteryCharge * segmentWidth;
            this.fillRect(
                -width / 2 + this.barX + (segmentWidth + segmentGap) * i,
                -height / 2 + this.barY + this.barHeight + 1,
                renderedWidth,
                this.batteryBarHeight
            );
        }
    }
}