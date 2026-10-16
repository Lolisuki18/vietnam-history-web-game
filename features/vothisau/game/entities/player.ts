import type Phaser from "phaser";

import type { Point } from "@/lib/engine";

import { sauAnim, type SauAnimKey } from "../assets/animations";
import { LOGICAL_FRAME, SAU_KEY, SAU_SHEET, SPRITE_ORIGIN } from "../assets/manifest";
import { setFeetBody } from "../assets/sprite-utils";

type Facing = "down" | "left" | "right" | "up";

/**
 * Chị Sáu as an animated physics sprite. The sprite's origin sits at the feet and the Arcade body
 * is a small square there, so `x` / `y` are the centre of the hitbox (and of the feet).
 */
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private currentAnim: SauAnimKey | null = null;
  private facing: Facing = "down";
  /** A one-shot pose (throwing, cutting a rope) is playing: walking resumes when it is over. */
  private posing = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add
      .sprite(x, y, SAU_KEY, 0)
      .setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y)
      .setDepth(y);
    setFeetBody(this.sprite);
    this.body.setCollideWorldBounds(true);
    this.setIdleFrame();
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get animation(): SauAnimKey | null {
    return this.currentAnim;
  }

  /** Where speech bubbles stand: above her head. */
  get head(): Point {
    return { x: this.sprite.x, y: this.sprite.y - LOGICAL_FRAME.height * SPRITE_ORIGIN.y - 6 };
  }

  /**
   * Pick the animation from the movement direction (`dx`, `dy` are the input axes, 0 when standing
   * still). `crouching` = sneaking in the crowd or crawling through a bush; `hiding` = standing
   * still inside a bush. Cheap enough to call every frame.
   */
  animate(dx: number, dy: number, crouching: boolean, hiding: boolean): void {
    this.sprite.setDepth(this.sprite.y);
    if (this.posing) return;
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      if (Math.abs(dx) > Math.abs(dy)) this.facing = dx < 0 ? "left" : "right";
      else this.facing = dy < 0 ? "up" : "down";
    }

    let key: SauAnimKey | null;
    if (!moving) key = hiding ? "hide" : null;
    else if (crouching) key = "sneak";
    else key = `walk_${this.facing}`;

    // The crouched poses are drawn facing right: mirror them for the other way.
    const mirrored =
      (key === "sneak" || key === "hide") && (dx < 0 || (!moving && this.facing === "left"));
    this.sprite.setFlipX(mirrored);

    if (key === this.currentAnim) return;
    this.currentAnim = key;
    if (key) this.sprite.anims.play(sauAnim(key), true);
    else {
      this.sprite.anims.stop();
      this.setIdleFrame();
    }
  }

  /** Play a one-shot pose ("throw", "interact") facing `towardX`; walking resumes afterwards. */
  pose(kind: "throw" | "interact", towardX: number): void {
    const key = sauAnim(kind);
    if (!this.sprite.scene.anims.exists(key)) return;
    this.posing = true;
    this.currentAnim = kind;
    this.sprite.setFlipX(towardX < this.sprite.x);
    this.sprite.anims.play(key, true);
    this.sprite.once("animationcomplete", () => {
      this.posing = false;
      this.currentAnim = null;
      this.sprite.setFlipX(false);
      this.setIdleFrame();
    });
  }

  setAlpha(alpha: number): void {
    this.sprite.setAlpha(alpha);
  }

  teleport(x: number, y: number): void {
    this.body.reset(x, y);
    this.posing = false;
    this.currentAnim = null;
  }

  destroy(): void {
    this.sprite.destroy();
  }

  private setIdleFrame(): void {
    const row = SAU_SHEET.rows[this.facing === "down" ? "down" : this.facing];
    this.sprite.setFrame(row * SAU_SHEET.columns);
  }
}
