import type Phaser from "phaser";

import {
  BAY_KEY,
  CAI_TONG_KEY,
  EXPLOSION_SHEET,
  NPC_SHEET,
  PAPER_SHEET,
  SAU_KEY,
  SAU_SHEET,
  SOLDIER_KEYS,
  SOLDIER_SHEET,
  VILLAGER_KEYS,
} from "./manifest";

/** Frames per second of the walking cycles (matched to the speeds in config.ts: no gliding). */
const SAU_WALK_FPS = 14;
const SAU_SNEAK_FPS = 9;
const SOLDIER_WALK_FPS = 8;

export type SauAnimKey =
  "walk_down" | "walk_left" | "walk_right" | "walk_up" | "sneak" | "throw" | "interact" | "hide";

export const sauAnim = (key: SauAnimKey): string => `${SAU_KEY}_${key}`;
export const soldierAnim = (texture: string, side: "left" | "right"): string =>
  `${texture}_${side}`;
export const npcAnim = (texture: string, state: "idle" | "scared"): string => `${texture}_${state}`;
export const PAPER_ANIM = "paper_shimmer";
export const EXPLOSION_ANIM = "explosion";

/** Register every animation. Safe to call again when the scene restarts (existing ones are kept). */
export function createAnimations(
  anims: Phaser.Animations.AnimationManager,
  textures: Phaser.Textures.TextureManager,
): void {
  const row = (
    key: string,
    texture: string,
    columns: number,
    rowIndex: number,
    frames: number,
    frameRate: number,
    repeat = -1,
  ): void => {
    if (anims.exists(key) || !textures.exists(texture)) return;
    anims.create({
      key,
      frames: anims.generateFrameNumbers(texture, {
        start: rowIndex * columns,
        end: rowIndex * columns + frames - 1,
      }),
      frameRate,
      repeat,
    });
  };

  const { columns, rows, frames } = SAU_SHEET;
  row(sauAnim("walk_down"), SAU_KEY, columns, rows.down, frames.walk, SAU_WALK_FPS);
  row(sauAnim("walk_left"), SAU_KEY, columns, rows.left, frames.walk, SAU_WALK_FPS);
  row(sauAnim("walk_right"), SAU_KEY, columns, rows.right, frames.walk, SAU_WALK_FPS);
  row(sauAnim("walk_up"), SAU_KEY, columns, rows.up, frames.walk, SAU_WALK_FPS);
  row(sauAnim("sneak"), SAU_KEY, columns, rows.sneak, frames.sneak, SAU_SNEAK_FPS);
  row(sauAnim("throw"), SAU_KEY, columns, rows.throw, frames.throw, 12, 0);
  row(sauAnim("interact"), SAU_KEY, columns, rows.interact, frames.interact, 8, 0);
  row(sauAnim("hide"), SAU_KEY, columns, rows.hide, frames.hide, 3);

  for (const texture of [...SOLDIER_KEYS, CAI_TONG_KEY]) {
    row(
      soldierAnim(texture, "left"),
      texture,
      SOLDIER_SHEET.columns,
      SOLDIER_SHEET.rows.left,
      SOLDIER_SHEET.columns,
      SOLDIER_WALK_FPS,
    );
    row(
      soldierAnim(texture, "right"),
      texture,
      SOLDIER_SHEET.columns,
      SOLDIER_SHEET.rows.right,
      SOLDIER_SHEET.columns,
      SOLDIER_WALK_FPS,
    );
  }
  for (const texture of [...VILLAGER_KEYS, BAY_KEY]) {
    row(
      npcAnim(texture, "idle"),
      texture,
      NPC_SHEET.columns,
      NPC_SHEET.rows.idle,
      NPC_SHEET.frames.idle,
      3,
    );
    row(
      npcAnim(texture, "scared"),
      texture,
      NPC_SHEET.columns,
      NPC_SHEET.rows.scared,
      NPC_SHEET.frames.scared,
      6,
    );
  }

  // The paper and the explosion are only animated when the real multi-frame picture has loaded.
  if (!anims.exists(PAPER_ANIM) && textures.exists(PAPER_SHEET.key)) {
    if (textures.get(PAPER_SHEET.key).frameTotal > 2) {
      anims.create({
        key: PAPER_ANIM,
        frames: anims.generateFrameNumbers(PAPER_SHEET.key, {
          start: 0,
          end: PAPER_SHEET.frames - 1,
        }),
        frameRate: 6,
        repeat: -1,
      });
    }
  }
  if (!anims.exists(EXPLOSION_ANIM) && textures.exists(EXPLOSION_SHEET.key)) {
    if (textures.get(EXPLOSION_SHEET.key).frameTotal > 2) {
      anims.create({
        key: EXPLOSION_ANIM,
        frames: anims.generateFrameNumbers(EXPLOSION_SHEET.key, {
          start: 0,
          end: EXPLOSION_SHEET.frames - 1,
        }),
        frameRate: 14,
        repeat: 0,
      });
    }
  }
}
