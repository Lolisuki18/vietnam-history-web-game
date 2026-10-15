import type Phaser from "phaser";

import { ASSET_KEYS, PEBBLE_ITEM_FRAME } from "../assets/manifest";
import { PEBBLE_SUPPLY } from "../config";

/** On-screen size of a pebble lying on the ground, in world px. */
const DISPLAY_SIZE = 30;

/**
 * A pebble lying on the ground that Kim Đồng can pick up (and throw). The artist's picture has
 * three kinds; the kind is picked at random. A plain grey dot stands in when it did not load.
 * Pebbles he threw onto dry land become pickups again, so they can be used twice.
 */
export class PebblePickup {
  private readonly view: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;
  private taken = false;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
  ) {
    if (scene.textures.exists(ASSET_KEYS.pebbleItem)) {
      const kind = Math.floor(Math.random() * PEBBLE_ITEM_FRAME.kinds);
      this.view = scene.add
        .sprite(x, y, ASSET_KEYS.pebbleItem, kind)
        .setDisplaySize(DISPLAY_SIZE, DISPLAY_SIZE)
        .setDepth(6);
    } else {
      this.view = scene.add.circle(x, y, 6, 0xa8a29e).setStrokeStyle(2, 0x44403c).setDepth(6);
    }
  }

  get isTaken(): boolean {
    return this.taken;
  }

  isNear(px: number, py: number): boolean {
    return !this.taken && Math.hypot(px - this.x, py - this.y) <= PEBBLE_SUPPLY.pickupRadius;
  }

  /** Pick it up: it pops and fades. */
  take(): void {
    if (this.taken) return;
    this.taken = true;
    this.scene.tweens.add({
      targets: this.view,
      y: this.y - 14,
      alpha: 0,
      duration: 220,
      onComplete: () => this.view.destroy(),
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.view);
    this.view.destroy();
  }
}
