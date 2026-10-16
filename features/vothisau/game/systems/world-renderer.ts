import type Phaser from "phaser";

import { IMAGE_KEYS, PROPS } from "../assets/manifest";
import type { LevelDef, Rect } from "../world-data";

/** Above every character (their depth is their y), below the speech bubbles. */
const SHADE_DEPTH = 5000;

/** The ground, the props (sorted by their feet), the bushes and the shade over everything. */
export function createWorld(scene: Phaser.Scene, level: LevelDef): void {
  const groundKey = level.ground === "forest" ? IMAGE_KEYS.groundForest : IMAGE_KEYS.groundMarket;
  scene.add.tileSprite(0, 0, level.world.w, level.world.h, groundKey).setOrigin(0, 0).setDepth(-10);

  for (const prop of level.props) {
    const size = PROPS[prop.key];
    scene.add
      .image(prop.x, prop.y, prop.key)
      .setOrigin(0.5, 1)
      .setDisplaySize(size.w, size.h)
      .setFlipX(prop.flip === true)
      .setDepth(prop.y);
  }

  level.bushes.forEach((bush, index) => {
    const key = index % 2 === 0 ? "prop_bush_a" : "prop_bush_b";
    // The picture is a little wider than the hiding circle; it is drawn over the player's feet.
    scene.add
      .image(bush.x, bush.y + bush.r * 0.55, key)
      .setOrigin(0.5, 1)
      .setDisplaySize(bush.r * 2.7, bush.r * 2.1)
      .setDepth(bush.y + bush.r * 0.55);
  });

  // The darkness of the night (or the warm haze of the day).
  scene.add
    .rectangle(0, 0, level.world.w, level.world.h, level.shade.color, level.shade.alpha)
    .setOrigin(0, 0)
    .setDepth(SHADE_DEPTH);
}

/** Invisible static bodies for every blocking rectangle; the player collides with them. */
export function createSolids(
  scene: Phaser.Scene,
  rects: readonly Rect[],
): Phaser.GameObjects.Rectangle[] {
  return rects.map((rect) => {
    const box = scene.add.rectangle(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h);
    scene.physics.add.existing(box, true);
    return box;
  });
}
