import type Phaser from "phaser";

import { HITBOX_SIZE, LOGICAL_FRAME, SPRITE_ORIGIN } from "./manifest";

/**
 * Show a character sprite at its world size. Works for any frame size: the real sheets are drawn
 * larger (so `scale` becomes < 1), the stand-in art is baked at the world size already.
 */
export function fitToWorld<T extends Phaser.GameObjects.Sprite>(sprite: T): T {
  sprite.setDisplaySize(LOGICAL_FRAME.width, LOGICAL_FRAME.height);
  return sprite;
}

/**
 * Give a physics sprite a square hitbox at its feet (`HITBOX_SIZE` world px), so that x / y of the
 * sprite are the centre of the hitbox whatever the resolution of the artwork.
 */
export function setFeetBody(sprite: Phaser.Physics.Arcade.Sprite): void {
  fitToWorld(sprite);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  // Body size and offset are in texture pixels: divide the world size by the sprite's scale.
  const size = HITBOX_SIZE / sprite.scaleX;
  body.setSize(size, size);
  body.setOffset(
    sprite.frame.width * SPRITE_ORIGIN.x - size / 2,
    sprite.frame.height * SPRITE_ORIGIN.y - size / 2,
  );
}
