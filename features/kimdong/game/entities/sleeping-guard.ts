import type Phaser from "phaser";

import { sleepAnim } from "../assets/animations";
import { ASSET_KEYS, EMOTE_SHEET, SPRITE_ORIGIN } from "../assets/manifest";
import { fitToWorld } from "../assets/sprite-utils";

/** Extra size of the sleeping pictures, and the height of the "zzz" above the feet, in world px. */
const SCALE_UP = 1.25;
const BUBBLE_HEIGHT = 50;

/**
 * A soldier asleep against a tree (first stage obstacle). He never wakes up and has no vision:
 * he is a solid thing to walk around, with "zzz" bubbling over his head. Nothing is created
 * when the artwork did not load. Row 0 of the sheet is the French soldier, row 1 the
 * "lính khố xanh".
 */
export class SleepingGuard {
  /** The invisible solid at his feet (add a collider with the player). */
  readonly body?: Phaser.GameObjects.Rectangle;
  private readonly sprite?: Phaser.GameObjects.Sprite;
  private readonly bubble?: Phaser.GameObjects.Sprite;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    row: 0 | 1,
  ) {
    if (!scene.textures.exists(ASSET_KEYS.soldierSleeping)) return;
    this.sprite = fitToWorld(
      scene.add
        .sprite(x, y, ASSET_KEYS.soldierSleeping, row * 4)
        .setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y)
        .setDepth(3 + y / 100_000),
    );
    // The seated figure fills less of its frame than a standing one: draw it a bit larger.
    this.sprite.setScale(this.sprite.scaleX * SCALE_UP, this.sprite.scaleY * SCALE_UP);
    if (scene.anims.exists(sleepAnim(row))) this.sprite.anims.play(sleepAnim(row));

    this.body = scene.add.rectangle(x, y - 9, 40, 20).setVisible(false);
    scene.physics.add.existing(this.body, true);

    if (
      scene.textures.exists(ASSET_KEYS.emotes) &&
      scene.textures.get(ASSET_KEYS.emotes).frameTotal > 4
    ) {
      const top = y - BUBBLE_HEIGHT;
      this.bubble = scene.add
        .sprite(x + 6, top, ASSET_KEYS.emotes, EMOTE_SHEET.frames.zzz)
        .setDisplaySize(26, 26)
        .setDepth(16);
      scene.tweens.add({
        targets: this.bubble,
        y: top - 7,
        alpha: 0.55,
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  destroy(): void {
    if (this.bubble) this.scene.tweens.killTweensOf(this.bubble);
    this.bubble?.destroy();
    this.sprite?.destroy();
    this.body?.destroy();
  }
}
