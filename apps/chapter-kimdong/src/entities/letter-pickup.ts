import type Phaser from "phaser";

const PICKUP_RADIUS = 28;

/** A secret letter (mật thư) lying on the ground: a glowing gold envelope. */
export class LetterPickup {
  private readonly envelope: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Arc;
  private taken = false;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
  ) {
    this.glow = scene.add.circle(x, y, 26, 0xfff2a8, 0.35).setDepth(8);
    scene.tweens.add({
      targets: this.glow,
      scale: 1.35,
      alpha: 0.1,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.envelope = scene.add.graphics({ x, y }).setDepth(9);
    this.envelope.fillStyle(0xfacc15, 1);
    this.envelope.fillRect(-12, -8, 24, 16);
    this.envelope.lineStyle(2, 0x92400e, 1);
    this.envelope.strokeRect(-12, -8, 24, 16);
    this.envelope.beginPath();
    this.envelope.moveTo(-12, -8);
    this.envelope.lineTo(0, 2);
    this.envelope.lineTo(12, -8);
    this.envelope.strokePath();
  }

  get isTaken(): boolean {
    return this.taken;
  }

  isNear(px: number, py: number): boolean {
    return !this.taken && Math.hypot(px - this.x, py - this.y) <= PICKUP_RADIUS;
  }

  /** Play the pick-up effect and remove the letter. */
  take(): void {
    if (this.taken) return;
    this.taken = true;
    this.scene.tweens.killTweensOf(this.glow);
    this.scene.tweens.add({
      targets: [this.envelope, this.glow],
      scale: 1.8,
      alpha: 0,
      duration: 260,
      onComplete: () => this.destroy(),
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf([this.envelope, this.glow]);
    this.envelope.destroy();
    this.glow.destroy();
  }
}
