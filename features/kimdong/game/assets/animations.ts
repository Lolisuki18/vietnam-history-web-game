import type Phaser from "phaser";

import { ASSET_KEYS, KIMDONG_SHEET, SOLDIER_SHEET } from "./manifest";

/** Animation keys of Kim Đồng. */
export type PlayerAnimKey = "idle" | "walk_left" | "walk_right" | "walk_up" | "walk_down" | "swim";

/** Animation keys of the French soldiers. */
export type SoldierAnimKey = "patrol_left" | "patrol_right";

function rowFrames(textureKey: string, row: number, columns: number) {
  return Array.from({ length: columns }, (_, column) => ({
    key: textureKey,
    frame: row * columns + column,
  }));
}

/**
 * Define every animation once. Safe to call again (e.g. after a restart): animations that
 * already exist are left alone, because the animation manager is shared by the whole game.
 */
export function createAnimations(anims: Phaser.Animations.AnimationManager): void {
  const define = (config: Phaser.Types.Animations.Animation): void => {
    if (config.key && !anims.exists(config.key)) anims.create(config);
  };

  const kim = ASSET_KEYS.kimdong;
  const { columns, rows } = KIMDONG_SHEET;
  define({ key: "idle", frames: [{ key: kim, frame: rows.down * columns }], frameRate: 1 });
  define({
    key: "walk_down",
    frames: rowFrames(kim, rows.down, columns),
    frameRate: 8,
    repeat: -1,
  });
  define({
    key: "walk_left",
    frames: rowFrames(kim, rows.left, columns),
    frameRate: 8,
    repeat: -1,
  });
  define({
    key: "walk_right",
    frames: rowFrames(kim, rows.right, columns),
    frameRate: 8,
    repeat: -1,
  });
  define({ key: "walk_up", frames: rowFrames(kim, rows.up, columns), frameRate: 8, repeat: -1 });
  define({ key: "swim", frames: rowFrames(kim, rows.swim, columns), frameRate: 5, repeat: -1 });

  const soldier = ASSET_KEYS.soldier;
  const soldierSheet = SOLDIER_SHEET;
  define({
    key: "patrol_left",
    frames: rowFrames(soldier, soldierSheet.rows.left, soldierSheet.columns),
    frameRate: 6,
    repeat: -1,
  });
  define({
    key: "patrol_right",
    frames: rowFrames(soldier, soldierSheet.rows.right, soldierSheet.columns),
    frameRate: 6,
    repeat: -1,
  });
}
