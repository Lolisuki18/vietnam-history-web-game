import { clamp } from "@vhg/engine";
import type Phaser from "phaser";

import { OXYGEN } from "../config";

const BAR_WIDTH = 46;
const BAR_HEIGHT = 7;
/** Above the head of the 48px tall sprite (its feet are at the logical position). */
const BAR_OFFSET_Y = -54;

/** Air supply while diving, drawn as a small bar above the player's head. */
export class OxygenMeter {
  private value = 1;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.background = scene.add
      .rectangle(0, 0, BAR_WIDTH + 4, BAR_HEIGHT + 4, 0x0b1b2b, 0.85)
      .setStrokeStyle(1, 0xffffff, 0.9)
      .setDepth(30)
      .setVisible(false);
    this.fill = scene.add
      .rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, 0x4fc3f7)
      .setOrigin(0, 0.5)
      .setDepth(31)
      .setVisible(false);
  }

  /** Returns true on the frame the air runs out. */
  update(dt: number, underwater: boolean): boolean {
    const before = this.value;
    this.value = clamp(
      this.value + (underwater ? -dt / OXYGEN.seconds : dt * OXYGEN.recoverPerSecond),
      0,
      1,
    );
    return underwater && before > 0 && this.value <= 0;
  }

  /** Position the bar above `(x, y)`; shown only while diving or recovering. */
  syncVisuals(x: number, y: number): void {
    const visible = this.value < 1;
    this.background.setVisible(visible);
    this.fill.setVisible(visible);
    if (!visible) return;
    this.background.setPosition(x, y + BAR_OFFSET_Y);
    this.fill.setPosition(x - BAR_WIDTH / 2, y + BAR_OFFSET_Y);
    this.fill.setSize(Math.max(0.001, BAR_WIDTH * this.value), BAR_HEIGHT);
    this.fill.setFillStyle(this.value < 0.3 ? 0xff5252 : 0x4fc3f7);
  }

  reset(): void {
    this.value = 1;
  }

  destroy(): void {
    this.background.destroy();
    this.fill.destroy();
  }
}
