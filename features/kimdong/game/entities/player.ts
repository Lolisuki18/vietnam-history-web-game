import type Phaser from "phaser";

import { SHOOT_LEFT_ANIM, SHOOT_RIGHT_ANIM, type PlayerAnimKey } from "../assets/animations";
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
  private facingLeft = false;

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
  animate(
    dx: number,
    dy: number,
    swimming: boolean,
    hiding: false | "bush" | "rock" = false,
  ): void {
    if (this.throwing) return;
    const moving = dx !== 0 || dy !== 0;
    if (dx !== 0) this.facingLeft = dx < 0;
    let key: PlayerAnimKey;
    if (swimming) key = moving ? "swim" : "swim_idle";
    else if (hiding) key = moving ? "crawl" : hiding === "rock" ? "hide_rock" : "hide";
    else if (!moving) key = "idle";
    else if (Math.abs(dx) > Math.abs(dy)) key = dx < 0 ? "walk_left" : "walk_right";
    else key = dy < 0 ? "walk_up" : "walk_down";

    // The water and hiding poses are drawn facing right: mirror them for the other way.
    const sideways =
      key === "swim" ||
      key === "swim_idle" ||
      key === "hide" ||
      key === "hide_rock" ||
      key === "crawl";
    this.sprite.setFlipX(sideways && this.facingLeft);

    if (key === this.currentAnim) return;
    this.currentAnim = key;
    this.sprite.anims.play(key, true);
  }

  /** Play the pebble-throwing pose once; walking resumes when it has finished. */
  playThrow(towardX: number): void {
    if (this.throwing || this.currentAnim === "swim" || this.currentAnim === "swim_idle") return;
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

  /**
   * Raise the rifle and fire (aim, shot, recoil), toward the right or the left. The last frame is
   * held: this is the ambush, and the scene moves on to the chase afterwards. Returns false when
   * the shooting artwork is missing, so the caller can use another way.
   */
  playShoot(towardRight: boolean): boolean {
    const key = towardRight ? SHOOT_RIGHT_ANIM : SHOOT_LEFT_ANIM;
    if (!this.sprite.scene.anims.exists(key)) return false;
    this.throwing = true;
    this.currentAnim = "shoot";
    this.sprite.setFlipX(false);
    this.sprite.anims.play(key, true);
    return true;
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
