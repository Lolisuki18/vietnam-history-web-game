import type Phaser from "phaser";

import {
  ASSET_KEYS,
  DUC_THANH_SHEET,
  KIMDONG_SHEET,
  SFX_SHEET,
  LETTER_SHEET,
  SOLDIER_SHEET,
  SOLDIER_TEXTURES,
  type SoldierTexture,
} from "./manifest";

/** Animation keys of Kim Đồng. */
export type PlayerAnimKey =
  | "idle"
  | "walk_left"
  | "walk_right"
  | "walk_up"
  | "walk_down"
  | "swim"
  | "swim_idle"
  | "hide"
  | "hide_rock"
  | "crawl"
  | "run"
  | "jump"
  | "throw"
  | "shoot";

/** Animation keys of Anh Đức Thanh. */
export type DucThanhAnimKey =
  "duc_thanh_down" | "duc_thanh_left" | "duc_thanh_right" | "duc_thanh_up";

/** Animation keys of the later-stage sheets (see `createAnimations`). */
export const sleepAnim = (row: number): string => `soldier_sleep_${row}`;
export const runAnim = (row: number): string => `soldier_run_${row}`;
export const SHOOT_ANIM_LEFT = "soldier_shoot_left";
export const CLIMB_ANIM = "kimdong_climb_anim";
export const SHOOT_LEFT_ANIM = "kimdong_shoot_left";
export const SHOOT_RIGHT_ANIM = "kimdong_shoot_right";
export const FALL_ANIM = "kimdong_fall_anim";
export const BIRD_ANIM = "tu_hu_flap";

/** The expanding sound ring that follows a pebble landing. */
export const RIPPLE_ANIM = "sfx_ripple";

/** Animation keys of the enemy soldiers: `<sheet>_left` / `<sheet>_right`. */
export type SoldierAnimKey = `${SoldierTexture}_${"left" | "right"}`;

export const LETTER_ANIM = "letter_shimmer";

/**
 * Frames per second of the walk cycles. A cycle is 4 frames = 2 steps of ~21 world px (the feet
 * are ~32 sheet px apart x SPRITE_SCALE), so 13 fps covers ~140 px/s: `PLAYER.speed`.
 * A cycle that covers less ground than the character moves looks like gliding.
 */
const WALK_FPS = 13;
/** Soldier cycle: 5 frames = 2 steps of ~25 world px, 7.5 fps covers ~75 px/s (`GUARD.speed`). */
const SOLDIER_FPS = 7.5;

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
  define({ key: "walk_down", frames: walk(rows.down), frameRate: WALK_FPS, repeat: -1 });
  define({ key: "walk_left", frames: walk(rows.left), frameRate: WALK_FPS, repeat: -1 });
  define({ key: "walk_right", frames: walk(rows.right), frameRate: WALK_FPS, repeat: -1 });
  define({ key: "walk_up", frames: walk(rows.up), frameRate: WALK_FPS, repeat: -1 });
  define({
    key: "swim",
    frames: rowFrames(kim, rows.swim, frames.swim, columns),
    frameRate: 5,
    repeat: -1,
  });
  define({
    key: "swim_idle",
    frames: rowFrames(kim, rows.swimIdle, frames.swimIdle, columns),
    frameRate: 2,
    repeat: -1,
  });
  // Crouching still in a bush, and crawling through it (a crawl cycle is 2 steps of ~26 world px).
  define({
    key: "hide",
    frames: rowFrames(kim, rows.hide, frames.hide, columns),
    frameRate: 2,
    repeat: -1,
  });
  define({
    key: "crawl",
    frames: rowFrames(kim, rows.crawl, frames.crawl, columns),
    frameRate: 7,
    repeat: -1,
  });
  define({
    key: "run",
    frames: rowFrames(kim, rows.run, frames.run, columns),
    // The ground scrolls much faster than one run cycle covers, so run as fast as the art allows.
    frameRate: 18,
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

  // Sheets made for the later stages. Rows: 0 French, 1 "lính khố xanh" (sleeping, running);
  // shooting: row 0 faces left, row 1 faces right.
  const defineRow = (
    texture: string,
    key: string,
    row: number,
    count: number,
    columns: number,
    config: Partial<Phaser.Types.Animations.Animation>,
  ): void => {
    if (!textures.exists(texture)) return;
    define({ key, frames: rowFrames(texture, row, count, columns), ...config });
  };
  for (const row of [0, 1]) {
    defineRow(ASSET_KEYS.soldierSleeping, sleepAnim(row), row, 4, 4, {
      frameRate: 2.5,
      repeat: -1,
    });
    defineRow(ASSET_KEYS.soldierRunning, runAnim(row), row, 6, 6, { frameRate: 14, repeat: -1 });
  }
  defineRow(ASSET_KEYS.soldierShooting, SHOOT_ANIM_LEFT, 0, 4, 4, { frameRate: 9, repeat: -1 });
  // Kim Đồng's shot: aim, fire (flash and smoke), recoil; 200 ms a frame, row 0 faces left, row 1 right.
  defineRow(ASSET_KEYS.kimdongShoot, SHOOT_LEFT_ANIM, 0, 3, 3, { frameRate: 5, repeat: 0 });
  defineRow(ASSET_KEYS.kimdongShoot, SHOOT_RIGHT_ANIM, 1, 3, 3, { frameRate: 5, repeat: 0 });
  defineRow(ASSET_KEYS.kimdongClimb, CLIMB_ANIM, 0, 4, 4, { frameRate: 6, repeat: -1 });
  defineRow(ASSET_KEYS.kimdongFall, FALL_ANIM, 0, 4, 4, { frameRate: 5, repeat: 0 });
  defineRow(ASSET_KEYS.kimdongHideRock, "hide_rock", 0, 3, 3, { frameRate: 2, repeat: -1 });
  defineRow(ASSET_KEYS.tuHuBird, BIRD_ANIM, 0, 4, 4, { frameRate: 9, repeat: -1 });

  if (textures.exists(ASSET_KEYS.ducThanh)) {
    const { columns: ducColumns, rows: ducRows } = DUC_THANH_SHEET;
    for (const direction of ["down", "left", "right", "up"] as const) {
      define({
        key: `duc_thanh_${direction}`,
        frames: rowFrames(ASSET_KEYS.ducThanh, ducRows[direction], ducColumns, ducColumns),
        frameRate: 9, // 4 frames = 2 steps of ~21 px: ~95 px/s, the speed he walks at
        repeat: -1,
      });
    }
  }
  if (
    textures.exists(ASSET_KEYS.sfx) &&
    textures.get(ASSET_KEYS.sfx).frameTotal > SFX_SHEET.ringTo
  ) {
    define({
      key: RIPPLE_ANIM,
      frames: anims.generateFrameNumbers(ASSET_KEYS.sfx, {
        start: SFX_SHEET.ringFrom,
        end: SFX_SHEET.ringTo,
      }),
      duration: 900,
      repeat: 0,
    });
  }

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
        frameRate: SOLDIER_FPS,
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
