import type Phaser from "phaser";

import {
  ASSET_KEYS,
  KIMDONG_SHEET,
  LETTER_SHEET,
  SOLDIER_SHEET,
  SOLDIER_TEXTURES,
  type SoldierTexture,
} from "./manifest";

/** Animation keys of Kim Đồng. */
export type PlayerAnimKey =
  "idle" | "walk_left" | "walk_right" | "walk_up" | "walk_down" | "swim" | "run" | "jump" | "throw";

/** Animation keys of the enemy soldiers: `<sheet>_left` / `<sheet>_right`. */
export type SoldierAnimKey = `${SoldierTexture}_${"left" | "right"}`;

export const LETTER_ANIM = "letter_shimmer";

/** The animation key of a soldier sheet walking left or right. */
export function soldierAnim(texture: SoldierTexture, direction: "left" | "right"): SoldierAnimKey {
  return `${texture}_${direction}`;
}

/** Frames `0..count-1` of a row of a sheet that has `columns` columns. */
function rowFrames(textureKey: string, row: number, count: number, columns: number) {
  return Array.from({ length: count }, (_, column) => ({
    key: textureKey,
    frame: row * columns + column,
  }));
}

/**
 * Define every animation once. Safe to call again (e.g. after a restart): animations that
 * already exist are left alone, because the animation manager is shared by the whole game.
 */
export function createAnimations(
  anims: Phaser.Animations.AnimationManager,
  textures: Phaser.Textures.TextureManager,
): void {
  const define = (config: Phaser.Types.Animations.Animation): void => {
    if (config.key && !anims.exists(config.key)) anims.create(config);
  };

  const kim = ASSET_KEYS.kimdong;
  const { columns, rows, frames } = KIMDONG_SHEET;
  const walk = (row: number) => rowFrames(kim, row, frames.walk, columns);
  define({ key: "idle", frames: [{ key: kim, frame: rows.down * columns }], frameRate: 1 });
  define({ key: "walk_down", frames: walk(rows.down), frameRate: 8, repeat: -1 });
  define({ key: "walk_left", frames: walk(rows.left), frameRate: 8, repeat: -1 });
  define({ key: "walk_right", frames: walk(rows.right), frameRate: 8, repeat: -1 });
  define({ key: "walk_up", frames: walk(rows.up), frameRate: 8, repeat: -1 });
  define({
    key: "swim",
    frames: rowFrames(kim, rows.swim, frames.swim, columns),
    frameRate: 5,
    repeat: -1,
  });
  define({
    key: "run",
    frames: rowFrames(kim, rows.run, frames.run, columns),
    frameRate: 12,
    repeat: -1,
  });
  define({
    key: "jump",
    frames: rowFrames(kim, rows.jump, frames.jump, columns),
    frameRate: 8,
    repeat: 0,
  });
  define({
    key: "throw",
    frames: rowFrames(kim, rows.throw, frames.throw, columns),
    frameRate: 12,
    repeat: 0,
  });

  for (const texture of SOLDIER_TEXTURES) {
    for (const direction of ["left", "right"] as const) {
      define({
        key: soldierAnim(texture, direction),
        frames: rowFrames(
          texture,
          SOLDIER_SHEET.rows[direction],
          SOLDIER_SHEET.columns,
          SOLDIER_SHEET.columns,
        ),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  // The letter shimmers: a plain envelope slowly fills with light and fades back. Only when the
  // real spritesheet loaded (the stand-in is a single picture).
  const letterFrames = textures.exists(ASSET_KEYS.letter)
    ? textures.get(ASSET_KEYS.letter).frameTotal
    : 0;
  if (anims.exists(LETTER_ANIM) || letterFrames <= LETTER_SHEET.frames) return;
  anims.create({
    key: LETTER_ANIM,
    frames: anims.generateFrameNumbers(ASSET_KEYS.letter, {
      start: 0,
      end: LETTER_SHEET.frames - 1,
    }),
    frameRate: 7,
    yoyo: true,
    repeat: -1,
  });
}
