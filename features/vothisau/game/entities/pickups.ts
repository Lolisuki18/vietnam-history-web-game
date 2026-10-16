import type Phaser from "phaser";

import { PAPER_ANIM } from "../assets/animations";
import { IMAGE_KEYS, PAPER_SHEET } from "../assets/manifest";
import { PEBBLES } from "../config";

/**
 * A paper lying on the ground (a leaflet, a newspaper, a secret letter) that bobs and glows so the
 * player can find it, even in the dark.
 */
export class PaperPickup {
  private readonly image: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Arc;
  private taken = false;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly index: number,
    readonly x: number,
    readonly y: number,
  ) {
    this.glow = scene.add
      .circle(x, y, 26, 0xffe9a0, 0.18)
      .setStrokeStyle(2, 0xffe9a0, 0.6)
      .setDepth(y - 1);
    this.image = scene.add.sprite(x, y, PAPER_SHEET.key, 0).setDepth(5300);
    this.image.setScale(PAPER_SHEET.displayWidth / this.image.width);
    if (scene.anims.exists(PAPER_ANIM)) this.image.anims.play(PAPER_ANIM);
    scene.tweens.add({
      targets: this.image,
      y: y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    scene.tweens.add({
      targets: this.glow,
      scale: 1.35,
      alpha: 0.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  get isTaken(): boolean {
    return this.taken;
  }

  isNear(px: number, py: number, radius = 36): boolean {
    return !this.taken && Math.hypot(px - this.x, py - this.y) <= radius;
  }

  take(): void {
    if (this.taken) return;
    this.taken = true;
    this.destroy();
  }

  destroy(): void {
    this.scene.tweens?.killTweensOf(this.image);
    this.scene.tweens?.killTweensOf(this.glow);
    this.image.destroy();
    this.glow.destroy();
  }
}

/** A pebble on the ground: walk over it to pick it up. */
export class PebblePickup {
  private readonly image: Phaser.GameObjects.Image;
  private taken = false;

  constructor(
    scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
  ) {
    this.image = scene.add
      .image(x, y, IMAGE_KEYS.pebble)
      .setDisplaySize(18, 18)
      .setDepth(y - 2);
  }

  get isTaken(): boolean {
    return this.taken;
  }

  isNear(px: number, py: number): boolean {
    return !this.taken && Math.hypot(px - this.x, py - this.y) <= PEBBLES.pickupRadius;
  }

  take(): void {
    this.taken = true;
    this.destroy();
  }

  destroy(): void {
    this.image.destroy();
  }
}
