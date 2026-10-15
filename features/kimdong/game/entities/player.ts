import type Phaser from "phaser";

import type { PlayerAnimKey } from "../assets/animations";
import { ASSET_KEYS, SPRITE_ORIGIN } from "../assets/manifest";
import { setFeetBody } from "../assets/sprite-utils";

/**
 * Kim Đồng (Dền) as an animated physics sprite. The sprite's origin sits at the feet and the
 * Arcade body is a small square there, so `x` / `y` are the centre of the hitbox exactly as
 * they were when the player was a plain rectangle.
 */
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private currentAnim: PlayerAnimKey | null = null;
  private throwing = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add
      .sprite(x, y, ASSET_KEYS.kimdong, 0)
      .setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y)
      .setDepth(20);
    setFeetBody(this.sprite);
    this.body.setCollideWorldBounds(true);
    this.animate(0, 0, false);
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

  /** The animation currently playing (for debugging and tests). */
  get animation(): PlayerAnimKey | null {
    return this.currentAnim;
  }

  /**
   * Pick the animation from the movement direction (`dx`, `dy` are the input axes, 0 when
   * standing still). Swimming wins over everything else. Cheap enough to call every frame.
   */
  animate(dx: number, dy: number, swimming: boolean): void {
    if (this.throwing) return;
    let key: PlayerAnimKey;
    if (swimming) key = "swim";
    else if (dx === 0 && dy === 0) key = "idle";
    else if (Math.abs(dx) > Math.abs(dy)) key = dx < 0 ? "walk_left" : "walk_right";
    else key = dy < 0 ? "walk_up" : "walk_down";

    if (key === this.currentAnim) return;
    this.currentAnim = key;
    this.sprite.anims.play(key, true);
  }

  /** Play the pebble-throwing pose once; walking resumes when it has finished. */
  playThrow(towardX: number): void {
    if (this.throwing || this.currentAnim === "swim") return;
    this.throwing = true;
    this.currentAnim = "throw";
    // The pose is drawn facing right: mirror it when throwing to the left.
    this.sprite.setFlipX(towardX < this.sprite.x);
    this.sprite.anims.play("throw", true);
    this.sprite.once("animationcomplete", () => {
      this.throwing = false;
      this.currentAnim = null;
      this.sprite.setFlipX(false);
    });
  }

  setAlpha(alpha: number): void {
    this.sprite.setAlpha(alpha);
  }

  teleport(x: number, y: number): void {
    this.body.reset(x, y);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
