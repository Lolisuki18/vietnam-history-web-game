import type Phaser from "phaser";

import type { Point } from "@/lib/engine";

import { npcAnim } from "../assets/animations";
import { LOGICAL_FRAME, NPC_SHEET, SPRITE_ORIGIN } from "../assets/manifest";
import { fitToWorld } from "../assets/sprite-utils";

/**
 * A person who only stands around: a villager at the market, comrade Bảy at his post. Villagers
 * chat (a looping idle) and run away, cowering, when the grenade goes off.
 */
export class Npc {
  readonly sprite: Phaser.GameObjects.Sprite;
  private scared = false;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly texture: string,
    x: number,
    y: number,
    /** Villagers face the player's side or the other at random. */
    flip = false,
  ) {
    this.sprite = fitToWorld(
      scene.add.sprite(x, y, texture, 0).setOrigin(SPRITE_ORIGIN.x, SPRITE_ORIGIN.y).setDepth(y),
    ).setFlipX(flip);
    const key = npcAnim(texture, "idle");
    if (scene.anims.exists(key)) {
      this.sprite.anims.play(key);
      // Do not let a whole crowd breathe in step.
      this.sprite.anims.setProgress(Math.random());
    } else {
      this.sprite.setFrame(NPC_SHEET.rows.idle * NPC_SHEET.columns);
    }
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  /** Where speech bubbles stand. */
  get head(): Point {
    return { x: this.sprite.x, y: this.sprite.y - LOGICAL_FRAME.height * SPRITE_ORIGIN.y - 8 };
  }

  /** Cower and run away from (fromX, fromY), staying inside `bounds`. */
  scare(fromX: number, fromY: number, distance: number, bounds: { w: number; h: number }): void {
    if (this.scared) return;
    this.scared = true;
    const key = npcAnim(this.texture, "scared");
    if (this.scene.anims.exists(key)) this.sprite.anims.play(key);
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    const run = Math.min(distance, 160 + Math.random() * 140);
    const tx = Math.min(bounds.w - 80, Math.max(80, this.x + Math.cos(angle) * run));
    const ty = Math.min(bounds.h - 80, Math.max(120, this.y + Math.sin(angle) * run));
    this.scene.tweens.add({
      targets: this.sprite,
      x: tx,
      y: ty,
      duration: 900 + Math.random() * 500,
      ease: "Sine.easeOut",
      onUpdate: () => this.sprite.setDepth(this.sprite.y),
    });
  }

  destroy(): void {
    // On a shutdown the scene's plugins may already be gone.
    this.scene.tweens?.killTweensOf(this.sprite);
    this.sprite.destroy();
  }
}
