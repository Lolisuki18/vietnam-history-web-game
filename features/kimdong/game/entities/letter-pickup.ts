import type Phaser from "phaser";

import { LETTER_ANIM } from "../assets/animations";
import { ASSET_KEYS, LETTER_DISPLAY_WIDTH } from "../assets/manifest";

const PICKUP_RADIUS = 28;
const BOB_HEIGHT = 5;

/**
 * A secret letter (mật thư) lying on the ground: the letter image bobbing gently over a
 * pulsing glow. The pickup radius is independent of the artwork, so swapping the image never
 * changes how close the player has to get.
 */
export class LetterPickup {
  private readonly image: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Arc;
  private readonly baseScale: number;
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

    this.image = scene.add.sprite(x, y, ASSET_KEYS.letter).setDepth(9);
    this.baseScale = LETTER_DISPLAY_WIDTH / this.image.width;
    this.image.setScale(this.baseScale);
    // Each letter starts at another point of the shimmer, so they do not pulse in step.
    if (scene.anims.exists(LETTER_ANIM)) {
      this.image.anims.play({ key: LETTER_ANIM, startFrame: Math.floor(Math.random() * 14) });
    }
    scene.tweens.add({
      targets: this.image,
      y: y - BOB_HEIGHT,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
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
    this.scene.tweens.killTweensOf([this.image, this.glow]);
    this.scene.tweens.add({
      targets: this.image,
      scale: this.baseScale * 1.8,
      alpha: 0,
      duration: 260,
      onComplete: () => this.destroy(),
    });
    this.scene.tweens.add({ targets: this.glow, scale: 1.8, alpha: 0, duration: 260 });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf([this.image, this.glow]);
    this.image.destroy();
    this.glow.destroy();
  }
}
