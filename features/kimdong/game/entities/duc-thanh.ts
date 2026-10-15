import type Phaser from "phaser";

import type { DucThanhAnimKey } from "../assets/animations";
import { ASSET_KEYS, DUC_THANH_SHEET, SPRITE_ORIGIN } from "../assets/manifest";
import { fitToWorld } from "../assets/sprite-utils";

/** How fast the cadre walks, in world px per second (matches his walk cycle, see animations.ts). */
const WALK_SPEED = 95;

/**
 * Anh Đức Thanh, the cadre. He waits where the briefing took place and, in the ambush, walks in
 * from behind. Decoration only: no physics, no effect on the guards. Does nothing when the
 * artwork did not load.
 */
export class DucThanh {
  private readonly sprite?: Phaser.GameObjects.Sprite;
  private tween?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    if (!scene.textures.exists(ASSET_KEYS.ducThanh)) return;
    this.sprite = fitToWorld(
      scene.add
        .sprite(x, y, ASSET_KEYS.ducThanh, 0)
        .setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y)
        .setDepth(14),
    );
    this.stand();
  }

  /** Stand still facing the player (the first frame of the "talk" row). */
  stand(): void {
    if (!this.sprite) return;
    this.sprite.anims.stop();
    this.sprite.setFrame(DUC_THANH_SHEET.rows.talk * DUC_THANH_SHEET.columns);
  }

  /** Walk in a straight line to (x, y), then stand. */
  walkTo(x: number, y: number, from?: { x: number; y: number }): void {
    const sprite = this.sprite;
    if (!sprite) return;
    if (from) sprite.setPosition(from.x, from.y);
    const dx = x - sprite.x;
    const dy = y - sprite.y;
    const direction: DucThanhAnimKey =
      Math.abs(dx) >= Math.abs(dy)
        ? dx < 0
          ? "duc_thanh_left"
          : "duc_thanh_right"
        : dy < 0
          ? "duc_thanh_up"
          : "duc_thanh_down";
    this.tween?.stop();
    sprite.anims.play(direction, true);
    this.tween = this.scene.tweens.add({
      targets: sprite,
      x,
      y,
      duration: (Math.hypot(dx, dy) / WALK_SPEED) * 1000,
      onComplete: () => this.stand(),
    });
  }

  destroy(): void {
    this.tween?.stop();
    this.sprite?.destroy();
  }
}
