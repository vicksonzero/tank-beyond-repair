import { Scene } from "phaser";

export class HpBar extends Phaser.GameObjects.Graphics {
    barWidth: number;
    barHeight: number;

    barX: number;
    barY: number;

    constructor(scene: Scene, x: number, y: number, barWidth: number, barHeight: number) {
        super(scene, { x: 0, y: 0 });
        this.barX = x;
        this.barY = y;
        this.barWidth = barWidth;
        this.barHeight = barHeight;
    }


    updateHPBar(hp: number, maxHP: number, widthBonus = 0) {
        this.clear();
        const width = this.barWidth + widthBonus;
        const height = this.barHeight;

        const hue = (hp / maxHP * 120 / 360);
        const color = Phaser.Display.Color.HSLToColor(hue, 1, 0.5).color;

        this.lineStyle(1, color, 1);
        this.strokeRect(-width / 2 + this.barX, -height / 2 + this.barY, width, height);

        this.fillStyle(color, 1);
        this.fillRect(-width / 2 + this.barX, -height / 2 + this.barY, hp / maxHP * width, height);
    }
}